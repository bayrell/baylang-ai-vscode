<style lang="scss" scoped>
.memory_page{
	padding-top: 5px;
	.buttons{
		display: flex;
		gap: 5px;
		margin-bottom: 5px;
	}
}
.memory_page :deep(textarea[name=content]){
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
.url_list{
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 10px;
}
.url_item{
	display: flex;
	align-items: center;
	gap: 10px;
}
.url_item input{
	flex: 1;
	padding: 5px;
	border: 1px solid #ccc;
	border-radius: 3px;
}
.url_item .remove{
	cursor: pointer;
	color: red;
}
</style>

<template>
	<div class="memory_page page">
		<div class="buttons" v-show="!model.crud.show_save && !model.crud.show_delete">
			<Button class="back" @click="layout.setPage('settings')">Back</Button>
			<Button class="success" @click="model.crud.showAdd()">Add</Button>
		</div>
		<Crud :crud="model.crud">
			<template v-slot:list>
				<div class="page_title">
					Memory list
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
				{{ model.crud.isAdd() ? "Add memory" : "Edit memory" }}
			</template>
			<template v-slot:save_content>
				<Field name="name">
					<div class="label">Name</div>
					<Input
						name="name"
						v-model="model.form.item.name"
					/>
				</Field>
				<Field name="url">
					<div class="label">URLs</div>
					<Input
						name="url"
						v-model="model.form.item.url"
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
	name: "Memory",
	components: {
		Button,
		Crud,
		Input,
		Field
	},
	computed: {
		model()
		{
			return this.layout.memory_page;
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
