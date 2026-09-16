<style lang="sass" scoped>
.mcp_servers{
	padding-top: 5px;
}
.mcp_servers .buttons{
	display: flex;
	gap: 5px;
	margin-bottom: 5px;
}
.list_env{
	.button_row{
		margin-bottom: 5px;
	}
	.item_env{
		display: flex;
		gap: 5px;
	}
	.item_env_key, .item_env_value{
		flex: 1;
	}
	.item_env_delete{
		display: flex;
		align-items: center;
	}
}
.reload_tools__button{
	display: flex;
	gap: 5px;
	align-items: center;
	margin-bottom: 5px;
}
</style>

<template>
	<div class="mcp_servers page">
		<div class="buttons"
			v-show="!model.crud.show_save && !model.crud.show_delete">
			<Button class="back" @click="layout.setPage('settings')">Back</Button>
			<Button class="success" @click="showAdd()">Add</Button>
		</div>
		<Crud :crud="model.crud">
			<template v-slot:list>
				<div class="page_title">
					Server list
				</div>
				<div class="list_item" v-for="item in items" :key="item.id">
					<div class="list_item__name">{{ item.name }}</div>
					<div class="list_item__buttons">
						<span @click="showEdit(item)">[Edit]</span>
						<span @click="showDelete(item)">[Delete]</span>
					</div>
				</div>
			</template>
			<template v-slot:save_title>
				{{ form_title }}
			</template>
			<template v-slot:save_content>
				<Field name="name">
					<div class="label">Name</div>
					<Input
						type="input"
						name="name"
						v-model="model.form.item.name"
					/>
				</Field>
				<Field name="prefix">
					<div class="label">Prefix</div>
					<Input
						type="input"
						name="prefix"
						v-model="model.form.item.prefix"
					/>
				</Field>
				<Field name="type">
					<div class="label">Type</div>
					<Input
						type="select"
						name="type"
						v-model="model.form.item.type"
						:options="item_types"
					/>
				</Field>
				<Field name="url" v-if="model.form.item.type == 'server'">
					<div class="label">Url</div>
					<Input
						type="input"
						name="url"
						v-model="model.form.item.url"
					/>
				</Field>
				<Field name="command" v-if="model.form.item.type == 'cli'">
					<div class="label">Command</div>
					<Input
						type="input"
						name="command"
						v-model="model.form.item.command"
					/>
				</Field>
				<Field name="args" v-if="model.form.item.type == 'cli'">
					<div class="label">Args</div>
					<Input
						type="input"
						name="args"
						v-model="item_args"
						@update:modelValue="updateArgs($event)"
					/>
				</Field>
				<div class="list_env">
					<div class="button_row">
						<Button @click="addEnv">Add env</Button>
					</div>
					<div class="item_env" v-for="(item, index) in item_env" :key="index">
						<div class="item_env_key">
							<Input
								type="input"
								v-model="item.key"
							/>
						</div>
						<div class="item_env_value">
							<Input
								type="input"
								v-model="item.value"
							/>
						</div>
						<div class="item_env_delete">
							<Button @click="removeEnv(index)">Remove</Button>
						</div>
					</div>
				</div>
				<div class="reload_tools">
					<div class="reload_tools__button">
						<Button @click="reloadTools">Reload</Button>
						<Result :result="model.reload_result" />
					</div>
					<div class="reload_tools__list"
						v-if="list_tools.length > 0"
					>
						Tools: {{ list_tools }}
					</div>
				</div>
			</template>
			<template v-slot:delete_message>
				Delete item {{ model.form.item.name }}?
			</template>
		</Crud>
	</div>
</template>

<script>
import Button from "@main/Components/Button.vue";
import Crud from "@main/Components/Crud.vue";
import Input from "@main/Components/Input.vue";
import Field from "@main/Components/Form/Field.vue";
import FieldGroup from "@main/Components/Form/FieldGroup.vue";
import Result from "@main/Components/Form/Result.vue";

export default {
	name: "MCPServers",
	components:
	{
		Button,
		Crud,
		Input,
		Field,
		FieldGroup,
		Result,
	},
	data(){
		return {
			item_args: "",
		};
	},
	computed: {
		model()
		{
			return this.layout.mcp_page;
		},
		items()
		{
			let items = this.model.items;
			items.sort((a, b) => {
				return a.name.localeCompare(b.name);
			});
			return items;
		},
		form_title()
		{
			if (!this.model.form.item) return "";
			if (this.model.crud.isAdd())
			{
				return "Add server";
			}
			return "Edit server";
		},
		item_types()
		{
			return [
				{"key": "cli", "value": "Console"},
				{"key": "server", "value": "Server"},
			];
		},
		item_env()
		{
			if (!this.model.form.item) return [];
			if (!this.model.form.item.env) return [];
			return this.model.form.item.env;
		},
		list_tools()
		{
			if (!this.model.form.item) return "";
			if (!this.model.form.item.tools) return "";
			const tools = this.model.form.item.tools.map(item => item.name);
			return tools.join(", ");
		}
	},
	mounted()
	{
		this.model.load();
	},
	methods:
	{
		showAdd()
		{
			this.model.crud.showAdd();
			this.item_args = "";
		},
		showEdit(item)
		{
			this.model.crud.showEdit(item.id);
			this.item_args = item.args.join(" ");
		},
		showDelete(item)
		{
			this.model.crud.showDelete(item.id);
		},
		updateArgs(value)
		{
			this.model.form.item.args = value.split(" ")
				.filter(item => item != "")
			;
		},
		addEnv()
		{
			this.model.form.item.env.push({
				"key": "",
				"value": "",
			})
		},
		removeEnv(index)
		{
			this.model.form.item.env.splice(index, 1);
		},
		async reloadTools()
		{
			await this.model.reloadTools();
			await this.model.load();
		}
	},
};

</script>