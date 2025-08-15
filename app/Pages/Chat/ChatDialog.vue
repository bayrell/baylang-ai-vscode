<style lang="scss" scoped>
.chat_dialog{
	display: flex;
	gap: 10px;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	flex: 1;
	padding-top: 30px;
	padding-bottom: 10px;
	padding-right: 10px;
	&__input{
		input{
			outline: none;
			padding: 5px 10px;
			border: 1px solid var(--border-color);
		}
	}
	&__buttons{
		display: flex;
		gap: 5px;
	}
}
</style>

<template>
	<div class="chat_dialog" v-if="model.show_dialog == 'edit' && currentItem != null">
		<div class="chat_dialog__message">
			Edit '{{ currentItem.title }}'
		</div>
		<div class="chat_dialog__input">
			<Input name="chat_name" v-model="chat_name" />
		</div>
		<div class="chat_dialog__buttons">
			<Button class="default small" @click="onCancel">Cancel</Button>
			<Button class="primary small" @click="onRename">Ok</Button>
		</div>
	</div>
	<div class="chat_dialog" v-if="model.show_dialog == 'delete' && currentItem != null">
		<div class="chat_dialog__messages">
			Delete '{{ currentItem.title }}'?
		</div>
		<div class="chat_dialog__buttons">
			<Button class="default small" @click="onCancel">Cancel</Button>
			<Button class="danger small" @click="onDelete">Delete</Button>
		</div>
	</div>
</template>

<script lang="js">
import Button from "@main/Components/Button.vue";
import Input from "@main/Components/Input.vue";

export default {
	name: "ChatDialog",
	components:
	{
		Button,
		Input,
	},
	data: function()
	{
		return {
			chat_id: "",
			chat_name: "",
		};
	},
	computed:
	{
		model()
		{
			return this.layout.chat_page;
		},
		currentItem()
		{
			return this.model.findChatById(this.model.show_dialog_id);
		},
	},
	mouned: function()
	{
		this.update();
	},
	updated: function()
	{
		this.update();
	},
	methods:
	{
		update()
		{
			if (this.chat_id == this.model.show_dialog_id) return;
			this.chat_id = this.model.show_dialog_id;
			this.chat_name = this.currentItem.title;
		},
		hide()
		{
			this.model.show_dialog = "";
		},
		onRename()
		{
			this.model.renameChat(this.chat_id, this.chat_name);
			this.hide();
		},
		onDelete()
		{
			this.model.deleteChat(this.chat_id);
			this.hide();
		},
		onCancel()
		{
			this.hide();
		}
	},
};
</script>