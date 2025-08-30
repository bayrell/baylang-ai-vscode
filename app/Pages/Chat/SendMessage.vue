<style lang="scss" scoped>
.send_message{
	&__files{
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-bottom: 5px;
	}
	&__file{
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 5px;
		cursor: pointer;
		font-size: 12px;
		background-color: #cecece;
		border-radius: 5px;
		padding: 3px 5px;
	}
	&__text{
		display: flex;
		align-items: stretch;
		input, button{
			padding: 5px 10px;
			border: 1px var(--border-color) solid;
			border-radius: 0;
		}
		input{
			flex: 1;
			border-right: 0;
		}
		input[name=message]{
			min-height: 75px;
			resize: vertical;
		}
		button{
			cursor: pointer;
		}
	}
}
</style>

<template>
	<div class="send_message__files">
		<div v-for="file in files" :key="file"
			class="send_message__file"
		>
			<span class="send_message__file_name">{{ getFileName(file) }}</span>
			<span class="send_message__file_remove" @click.stop="removeFile(file)">x</span>
		</div>
	</div>
	<div class="send_message__tools">
		<Input
			name="agent"
			type="select"
			v-model="model.current_agent_id"
			selectMessage="Select agent"
			:options="agents"
		/>
	</div>
	<div class="send_message__text">
		<Input type="textarea" name="message" v-model="message" />
		<Button @click="sendMessage">Send</Button>
	</div>
</template>

<script lang="js">
import Button from "@main/Components/Button.vue";
import Input from "@main/Components/Input.vue";
import { getFileName } from "@main/lib.js";

export default {
	name: "SendMessage",
	components: {
		Button,
		Input,
	},
	data: function(){
		return {
			message: "",
		};
	},
	computed:
	{
		model()
		{
			return this.layout.chat_page;
		},
		agents()
		{
			var items = this.layout.agent_page.items.map((item)=>{
				return {
					"key": item.name,
					"value": item.name,
				};
			});
			items.sort((a,b) => a.value.localeCompare(b.value));
			return items;
		},
		files()
		{
			var chat = this.model.getCurrentChat();
			if (!chat) return [];
			
			return chat.getFiles();
		},
	},
	methods:
	{
		sendMessage()
		{
			this.model.sendMessage(
				this.model.current_chat_id,
				this.model.current_agent_id,
				this.message
			);
			this.message = "";
		},
		getFileName,
		removeFile(file)
		{
			var chat = this.model.getCurrentChat();
			if (!chat) return;
			
			chat.removeFile(file);
		},
	},
}
</script>