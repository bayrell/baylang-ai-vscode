<style scoped>
.mcp_servers{
	
}
</style>

<template>
	<div class="mcp_servers page">
		<div class="buttons"
			v-show="!model.crud.show_save && !model.crud.show_delete">
			<Button class="back" @click="layout.setPage('settings')">Back</Button>
			<Button class="success" @click="showAdd()">Add</Button>
		</div>
		<Crud :model="model.crud">
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
import Field from "@main/Components/Field.vue";
import FieldGroup from "@main/Components/FieldGroup.vue";
import Result from "@main/Components/Result.vue";

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
		};
	},
	computed: {
		model()
		{
			this.layout.mcp_page;
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
			if (!this.form.item) return "";
			if (this.model.crud.isAdd())
			{
				return "Add server";
			}
			return "Edit server";
		},
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
		},
		showEdit(item)
		{
			this.model.crud.showEdit(item.pk);
		},
		showDelete(item)
		{
			this.model.crud.showDelete(item.pk);
		},
	},
};

</script>