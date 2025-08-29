<style lang="scss" scoped>
.rules_page{
	padding-top: 5px;
	.buttons{
		display: flex;
		gap: 5px;
		margin-bottom: 5px;
	}
}
.rules_page :deep(textarea[name=content]){
	min-height: 250px;
	resize: vertical;
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
	<div class="rules_page">
		<div class="buttons" v-show="!model.crud.show_save && !model.crud.show_delete">
			<Button class="back" @click="layout.setPage('settings')">Back</Button>
			<Button class="success" @click="model.crud.showAdd()">Add</Button>
		</div>
		<Crud :crud="model.crud">
			<template v-slot:list>
				<div class="page_title">
					Rules list
				</div>
				<div v-for="item in items" :key="item.name"
					class="list_item"
				>
					<div class="list_item__name">{{ item.name }}</div>
					<div class="list_item__buttons">
						<span @click="model.crud.showEdit(item.name)">[Edit]</span>
						<span @click="model.crud.showDelete(item.name)">[Delete]</span>
					</div>
				</div>
			</template>
			<template v-slot:save_title>
				{{ model.crud.isAdd() ? "Add rule" : "Edit rule" }}
			</template>
			<template v-slot:save_content>
				<Field name="name">
					<label for="name">Name</label>
					<Input
						name="name"
						v-model="model.form.item.name"
					/>
				</Field>
				<Field name="description">
					<label for="name">Description</label>
					<Input
						name="description"
						v-model="model.form.item.description"
					/>
				</Field>
				<Field name="rules">
					<label for="rules">Rule</label>
					<Input
						name="rules"
						v-model="model.form.item.rules"
					/>
				</Field>
				<Field name="content">
					<label for="rule">Content</label>
					<Input
						type="textarea"
						name="content"
						v-model="model.form.item.content"
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
	name: "Rules",
	components: {
		Button,
		Crud,
		Input,
		Field
	},
	computed: {
		model()
		{
			return this.layout.rules_page;
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
};
</script>