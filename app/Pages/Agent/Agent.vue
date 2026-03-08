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
.agent_page :deep(.texteditable){
	min-height: 48px;
	max-height: 200px;
	overflow-y: auto;
}
.rules{
	&:deep(.button){
		margin-bottom: 0.5rem;
	}
}
.rules_item{
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	&:deep(.input){
		flex: 1;
		width: auto;
	}
	img{
		width: 16px;
		height: 16px;
		cursor: pointer;
	}
}
</style>

<template>
	<div class="agent_page page">
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
						<span @click="model.crud.showEdit(item.pk); reload_result.clear();">[Edit]</span>
						<span @click="model.crud.showDelete(item.pk)">[Delete]</span>
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
						name="name"
						v-model="model.form.item.name"
					/>
				</Field>
				<Field name="enable_rules">
					<div class="label">Enable rules</div>
					<Input
						type="select"
						name="enable_rules"
						v-model="model.form.item.enable_rules"
						:options="boolean_options"
					/>
				</Field>
				<Field name="enable_tools">
					<div class="label">Enable tools</div>
					<Input
						type="select"
						name="enable_tools"
						v-model="model.form.item.enable_tools"
						:options="boolean_options"
					/>
				</Field>
				<div class="default_model_name" v-if="model.form.item.default && model.form.item.default.model">
					Default model {{ model.form.item.default.model }} ({{ model.form.item.default.model_name }})
				</div>
				<Field name="model">
					<div class="label">Model</div>
					<Input
						type="select"
						name="model"
						v-model="model.form.item.model"
						:options="models"
					/>
				</Field>
				<Field name="model_name" :error="reload_result">
					<div class="label">Model name</div>
					<FieldGroup>
						<Input
							type="select"
							name="model_name"
							v-model="model.form.item.model_name"
							:options="model_names"
						/>
						<Button @click="reloadModels">Reload</Button>
					</FieldGroup>
				</Field>
				<Field name="prompt">
					<div class="label">Prompt</div>
					<TextEditable
						name="prompt"
						v-model="model.form.item.prompt"
					/>
				</Field>
				<Field name="rules">
					<div class="label">Rules</div>
					<div class="rules">
						<Button class="default small" @click="this.model.addRule()">Add</Button>
						<div class="rules_item"
							v-for="(item, index) in model.form.item.rules"
							:key="index"
						>
							<Input v-model="model.form.item.rules[index]" />
							<img :src="this.layout.getImage('x.svg')"
								@click="this.model.removeRule(index)" />
						</div>
					</div>
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
import TextEditable from "@main/Components/TextEditable.vue"

export default {
	name: "Agent",
	components: {
		Button,
		Crud,
		Input,
		Field,
		FieldGroup,
		TextEditable,
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
			var models = model.models.map(item => {
				return {
					key: item.id,
					value: item.id,
				};
			}).sort((a, b) => { return a.key.localeCompare(b.key); });
			return models;
		},
		boolean_options()
		{
			return [
				{ key: "0", value: "No" },
				{ key: "1", value: "Yes" },
			]
		},
		items()
		{
			var items = this.model.items.slice();
			items.sort((a, b) => {
				if (a.global && !b.global) return -1;
				if (!a.global && b.global) return 1;
				return a.name.localeCompare(b.name)
			});
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