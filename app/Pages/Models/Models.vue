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
</style>

<template>
	<div class="models_page">
		<div class="buttons" v-show="!model.crud.show_save && !model.crud.show_delete">
			<Button class="back" @click="layout.setPage('settings')">Back</Button>
			<Button class="success" @click="model.crud.showAdd()">Add</Button>
		</div>
		<Crud :crud="model.crud">
			<template v-slot:list>
				<div class="page_title">
					Models list
				</div>
				<div v-for="item in items" :key="item.id"
					class="list_item"
				>
					<div class="list_item__name">{{ item.name }}</div>
					<div class="list_item__buttons">
						<span @click="model.crud.showEdit(item.id)">[Edit]</span>
						<span @click="model.crud.showDelete(item.id)">[Delete]</span>
					</div>
				</div>
			</template>
			<template v-slot:save_title>
				{{ model.crud.isAdd() ? "Add model" : "Edit model" }}
			</template>
			<template v-slot:save_content>
				<Field name="name">
					<label for="name">Name</label>
					<Input
						name="name"
						v-model="model.form.item.name"
					/>
				</Field>
				<Field name="model">
					<label for="name">Type</label>
					<Input
						type="select"
						name="type"
						v-model="model.form.item.type"
						:options="getModels()"
					/>
				</Field>
				<Field name="key" v-if="isShowKey()">
					<label for="name">API key</label>
					<Input
						name="key"
						v-model="model.form.item.settings.key"
					/>
				</Field>
				<Field name="url" v-if="isShowUrl()">
					<label for="name">URL</label>
					<Input
						name="url"
						v-model="model.form.item.settings.url"
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

export default {
	name: "Models",
	components: {
		Button,
		Crud,
		Input,
		Field,
	},
	data(){
		return {
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
	},
	mounted()
	{
		this.model.load();
	},
	methods:
	{
		getModels()
		{
			return [
				{"key": "gemini", "value": "Gemini"},
				{"key": "ollama", "value": "Ollama"},
			];
		},
		isShowKey()
		{
			return this.model.form.item.type == "gemini";
		},
		isShowUrl()
		{
			return this.model.form.item.type == "ollama";
		},
	},
}
</script>