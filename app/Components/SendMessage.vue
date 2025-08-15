<style lang="scss">
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
		}
		button{
			cursor: pointer;
		}
	}
}
</style>

<template>
	<div class="send_message__files">
		<div v-for="file in getFiles()" :key="file"
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
			v-model="layout.current_agent_id"
			selectMessage="Select agent"
			:options="getAgents()"
		/>
	</div>
	<div class="send_message__text">
		<Input type="textarea" name="message" v-model="message" />
		<Button @click="sendMessage">Send</Button>
	</div>
</template>

<script lang="js">
import Button from "./Button.vue";
import Input from "./Input.vue";
import { getFileName } from "../lib.js";

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
	methods:
	{
		sendMessage()
		{
			this.layout.sendMessage(
				this.layout.current_chat_id,
				this.layout.current_agent_id,
				this.message
			);
			this.message = "";
		},
		getAgents()
		{
			return this.layout.agents.map((item)=>{
				return {
					"key": item.id,
					"value": item.name,
				};
			});
		},
		getFileName,
		getFiles()
		{
			var chat = this.layout.getCurrentChat();
			if (!chat) return [];
			
			return chat.getFiles();
		},
		removeFile(file)
		{
			var chat = this.layout.getCurrentChat();
			if (!chat) return;
			
			chat.removeFile(file);
		},
	},
}
</script>