<style lang="scss" scoped>
.agent_page{
	padding-top: 5px;
	.buttons{
		display: flex;
		gap: 5px;
		margin-bottom: 5px;
	}
}
.save_item_buttons{
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	margin-top: 20px;
}
.agent_page :deep(.crud .list .page_title){
	margin-top: 10px;
}
.list_item{
	display: flex;
	justify-content: space-between;
	gap: 10px;
	margin-bottom: 10px;
	&:last-child{
		margin-bottom: 0px;
	}
	&__name{
		flex: 1;
	}
	&__buttons{
		display: flex;
		justify-content: space-between;
		gap: 5px;
		span{
			cursor: pointer;
		}
	}
}
.default_model_name{
	margin-top: 10px;
	margin-bottom: 10px;
}
.agent_page :deep(.save_item textarea){
	min-height: 200px;
}
</style>

<template>
	<div class="agent_page">
		<div class="buttons" v-show="!model.crud.show_save && !model.crud.show_delete">
			<Button class="back" @click="layout.setPage('settings')">Back</Button>
			<Button class="success" @click="showAdd(true)">Add global</Button>
			<Button class="success" @click="showAdd(false)">Add project</Button>
		</div>
		<Crud :crud="model.crud">
			<template v-slot:list>
				<div class="page_title">
					Agent list
				</div>
				<div v-for="item in items" :key="item.name + item.global ? ' global' : ''"
					class="list_item"
				>
					<div class="list_item__name">{{ item.name }}</div>
					<div class="list_item__type">{{ item.global ? "Global" : "Local" }}</div>
					<div class="list_item__buttons">
						<span @click="model.crud.showEdit(item.name)">[Edit]</span>
						<span @click="model.crud.showDelete(item.name)">[Delete]</span>
					</div>
				</div>
			</template>
			<template v-slot:save_title>
				{{ form_title }}
			</template>
			<template v-slot:save_content>
				<Field name="name">
					<label for="name">Name</label>
					<Input
						name="name"
						v-model="model.form.item.name"
					/>
				</Field>
				<Field name="enable_rules">
					<label for="name">Enable rules</label>
					<Input
						type="select"
						name="enable_rules"
						v-model="model.form.item.enable_rules"
						:options="enable_rules"
					/>
				</Field>
				<div class="default_model_name" v-if="model.form.item.default && model.form.item.default.model">
					Default model {{ model.form.item.default.model }} ({{ model.form.item.default.model_name }})
				</div>
				<Field name="model">
					<label for="name">Model</label>
					<Input
						type="select"
						name="model"
						v-model="model.form.item.model"
						:options="models"
					/>
				</Field>
				<Field name="name" :error="reload_result">
					<label for="name">Model name</label>
					<FieldGroup>
						<Input
							type="select"
							name="name"
							v-model="model.form.item.model_name"
							:options="model_names"
						/>
						<Button @click="reloadModels">Reload</Button>
					</FieldGroup>
				</Field>
				<Field name="prompt">
					<label for="prompt">Prompt</label>
					<Input
						type="textarea"
						name="prompt"
						v-model="model.form.item.prompt"
					/>
				</Field>
			</template>
			<template v-slot:delete_message>
				Delete item {{ model.form.item.name }}?
			</template>
		</Crud>
	</div>
</template>

<script lang="js">
import Button from "@main/Components/Button.vue";
import Crud from "@main/Components/Crud.vue";
import Input from "@main/Components/Input.vue";
import Field from "@main/Components/Form/Field.vue";
import FieldGroup from "@main/Components/Form/FieldGroup.vue";
import Result from "@main/Components/Form/Result.js";

export default {
	name: "Agent",
	components: {
		Button,
		Crud,
		Input,
		Field,
		FieldGroup,
	},
	data(){
		return {
			reload_result: new Result(),
		};
	},
	computed: {
		model()
		{
			return this.layout.agent_page;
		},
		models()
		{
			var models = this.layout.models_page.items;
			models = models.map(
				(model) => {
					return {
						"key": model.id,
						"value": model.name,
					};
				}
			);
			models.sort(
				(a, b) => {
					if (a.global && !b.global) return -1;
					if (!a.global && b.global) return 1;
					return a.value.localeCompare(b.value);
				}
			);
			return models;
		},
		model_names()
		{
			var name = this.model.form.item.model;
			var model = this.layout.models_page.findItemById(name);
			if (!model) return [];
			if (!model.models) return [];
			return model.models.map(item => {
				return {
					key: item.id,
					value: item.id,
				};
			});
		},
		enable_rules()
		{
			return [
				{ key: "0", value: "No" },
				{ key: "1", value: "Yes" },
			]
		},
		items()
		{
			var items = this.model.items.slice();
			items.sort((a, b) => a.name.localeCompare(b.name));
			return items;
		},
		form_title()
		{
			if (!this.model.form.item) return "";
			if (this.model.crud.isAdd())
			{
				if (this.model.form.item.global)
				{
					return "Add global model";
				}
				else
				{
					return "Add local model";
				}
			}
			else
			{
				if (this.model.form.item.global)
				{
					return "Edit global model";
				}
				else
				{
					return "Edit local model";
				}
			}
		},
	},
	mounted()
	{
		this.model.load();
	},
	methods:
	{
		async reloadModels()
		{
			this.reload_result.setWaitMessage();
			var result = await this.layout.models_page.reloadModels(this.model.form.item.model);
			this.reload_result.setApiResult(result);
		},
		showAdd(global)
		{
			this.model.crud.showAdd();
			this.model.setGlobal(global);
		}
	},
}
</script>