<style lang="scss" scoped>
.models_page{
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
.models_page :deep(.crud .list .page_title){
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
.models_list .models_list_button{
	padding-bottom: 0.5rem;
}
.models_list_message{
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100px;
}
.models_list_item{
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	position: relative;
	padding-bottom: 0.5rem;
	.models_list_key{
		word-wrap: break-word;
		width: 100px;
	}
	.models_list_name{
		position: relative;
		gap: 1;
	}
	.models_list_delete{
		cursor: pointer;
	}
	input{
		width: 100%;
		background-color: var(--vscode-input-background, white);
		border: 1px solid var(--border-color);
		border-radius: 5px;
		color: var(--input-color);
		outline: 0;
		padding: 4px;
	}
}
</style>

<template>
	<div class="models_page page">
		<div class="buttons" v-show="!model.crud.show_save && !model.crud.show_delete">
			<Button class="back" @click="layout.setPage('settings')">Back</Button>
			<Button class="success" @click="model.crud.showAdd()">Add</Button>
		</div>
		<Crud :crud="model.crud">
			<template v-slot:list>
				<div class="page_title">
					Models list
				</div>
				<div v-for="item in items" :key="item.name"
					class="list_item"
				>
					<div class="list_item__name">{{ item.name }}</div>
					<div class="list_item__buttons">
						<span @click="model.crud.showEdit(item.name); this.reload_result.clear();">[Edit]</span>
						<span @click="model.crud.showDelete(item.name)">[Delete]</span>
					</div>
				</div>
			</template>
			<template v-slot:save_title>
				{{ model.crud.isAdd() ? "Add model" : "Edit model" }}
			</template>
			<template v-slot:save_content>
				<Field name="model_name">
					<div class="label">Name</div>
					<Input
						name="model_name"
						autocomplete="username"
						v-model="model.form.item.name"
					/>
				</Field>
				<Field name="type">
					<div class="label">Type</div>
					<Input
						type="select"
						name="type"
						v-model="model.form.item.type"
						:options="getModels()"
						@change="typeChange"
					/>
				</Field>
				<Field name="key" v-if="isShowKey()">
					<div class="label">API key</div>
					<Input
						type="password"
						name="key"
						autocomplete="new-password"
						v-model="model.form.item.settings.key"
					/>
				</Field>
				<Field name="url" v-if="isShowUrl()">
					<div class="label">URL</div>
					<Input
						name="url"
						v-model="model.form.item.settings.url"
					/>
				</Field>
				<Field name="select_model" :error="reload_result">
					<div class="label">Model list</div>
					<FieldGroup>
						<Input
							type="select"
							name="select_model"
							v-model="select_model"
							:options="model_options"
						/>
						<Button @click="reloadModels">Reload</Button>
					</FieldGroup>
				</Field>
				<div class="models_list">
					<div class="models_list_button">
						<Button class="default small" @click="this.model.addListItem(this.select_model)">Add</Button>
					</div>
					<div v-for="item in models_list" class="models_list_item" :key="item.key">
						<span class="models_list_key">{{ item.key }}</span>
						<span class="models_list_name">
							<input v-model="item.name" />
						</span>
						<span class="models_list_delete" @click="this.model.removeListItem(item.key)">[D]</span>
					</div>
					<div class="models_list_message" v-if="models_list.length == 0">
						Add models to list for usage
					</div>
				</div>
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
	name: "Models",
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
			select_model: "",
		};
	},
	computed: {
		model()
		{
			return this.layout.models_page;
		},
		items()
		{
			var items = this.model.items.slice();
			items.sort((a, b) => a.name.localeCompare(b.name));
			return items;
		},
		model_options()
		{
			if (!this.model.form.item) return [];
			
			var items = this.model.form.item.models;
			if (!items) return [];
			
			return items.map((item) => { return {
				"key": item.id,
				"value": item.id,
			}; }).sort((a, b) => { return a.key.localeCompare(b.key) });
		},
		models_list()
		{
			if (!this.model.form.item) return [];
			var items = this.model.form.item.list;
			if (!items) return [];
			return items;
		},
	},
	mounted()
	{
		this.model.load();
	},
	methods:
	{
		getModels()
		{
			var arr = [
				{"key": "gemini", "value": "Gemini"},
				{"key": "openrouter", "value": "Open Router"},
				{"key": "grok", "value": "Grok"},
				{"key": "ollama", "value": "Ollama"},
				{"key": "openai", "value": "OpenAI"},
			];
			arr.sort((a, b) => { return a.value.localeCompare(b.value); });
			return arr;
		},
		isShowKey()
		{
			var arr = ["gemini", "openrouter", "grok", "openai"];
			return arr.indexOf(this.model.form.item.type) != -1;
		},
		isShowUrl()
		{
			return ["ollama", "openai"].indexOf(this.model.form.item.type) != -1;
		},
		isWrongUrl()
		{
			if (!this.model.form.item.settings.url) return true;
			if (this.model.form.item.type != "openai" && this.model.form.item.settings.url == "https://api.openai.com/v1/") return true;
			return false;
		},
		typeChange()
		{
			if (!this.isWrongUrl()) return;
			if (this.model.form.item.type == "openai")
			{
				this.model.form.item.settings.url = "https://api.openai.com/v1/";
			}
			else this.model.form.item.settings.url = "";
		},
		async reloadModels()
		{
			if (this.model.form.pk === null) await this.model.add();
			else this.model.save();
			this.reload_result.setWaitMessage();
			var result = await this.model.reloadModels(this.model.form.pk);
			this.reload_result.setApiResult(result);
			this.model.refresh();
		},
	},
}
</script>