<style lang="scss" scoped>
.save_item_buttons{
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	margin-top: 20px;
}
</style>

<template>
	<div class="crud">
		<div class="list" v-show="!crud.show_save && !crud.show_delete">
			<slot name="list"></slot>
		</div>
		<div class="save_item" v-show="crud.show_save">
			<div class="page_title">
				<slot name="save_title"></slot>
			</div>
			<div class="save_item_fields">
				<slot name="save_content"></slot>
			</div>
			<div class="save_item_buttons">
				<Button class="success" @click="crud.addItem()" v-if="crud.isAdd()">Add</Button>
				<Button class="success" @click="crud.saveItem()" v-else>Save</Button>
				<Button class="default" @click="crud.cancel()">Cancel</Button>
			</div>
		</div>
		<div class="delete_item" v-if="crud.show_delete">
			<div class="delete_item_message">
				<slot name="delete_message"></slot>
			</div>
			<div class="save_item_buttons">
				<Button class="success" @click="crud.deleteItem()">Delete</Button>
				<Button class="default" @click="crud.cancel()">Cancel</Button>
			</div>
		</div>
	</div>
</template>

<script lang="js">
import Button from "./Button.vue";
import Input from "./Input.vue";
import Field from "./Form/Field.vue";

export default {
	name: "Models",
	components: {
		Button,
		Input,
		Field,
	},
	props: {
		crud: {
			type: Object,
		},
	}
}
</script>