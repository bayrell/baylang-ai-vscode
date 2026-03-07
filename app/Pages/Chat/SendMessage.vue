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
		background-color: var(--tab-color);
		border-radius: 5px;
		padding: 3px 5px;
	}
	&__file_remove{
		color: var(--vscode-foreground, black);
	}
	&__box{
		background-color: var(--vscode-input-background, white);
			color: var(--vscode-input-foreground, black);
		border: 1px var(--border-color) solid;
		border-radius: 5px;
	}
	&__tools{
		display: flex;
		position: relative;
		&:deep(.select_list){
			max-width: 50%;
		}
	}
	&__text{
		position: relative;
		&:deep(.texteditable){
			padding: 8px;
			min-height: 40px;
			max-height: 90px;
			overflow-y: auto;
			resize: none;
			border-width: 0;
			outline: none;
		}
		&:deep(.button){
			cursor: pointer;
			padding: 0.5rem 1rem;
			border-radius: 1rem;
		}
	}
	&__footer{
		display: flex;
		justify-content: flex-end;
		padding: 0.5rem;
	}
	&__models{
		flex: 1;
		&:deep(.input){
			width: auto;
			border-width: 0;
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
	<div class="send_message__box">
		<div class="send_message__tools">
			<SelectList
				name="agent"
				v-model="model.current_agent_id"
				selectMessage="Select agent"
				:options="agents"
			/>
			<SelectList
				name="model"
				v-model="model.current_model_key"
				selectMessage="Default"
				:options="models"
			/>
		</div>
		<div class="send_message__text">
			<TextEditable name="message" v-model="model.send_message" />
			<div class="send_message__footer">
				<div class="send_message__button">
					<Button @click="sendMessage" v-if="!chat || !chat.isWorking()">Send</Button>
					<Button @click="stopChat" v-if="chat && chat.isWorking()">Stop</Button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="js">
import Button from "@main/Components/Button.vue";
import Input from "@main/Components/Input.vue";
import SelectList from "@main/Components/SelectList.vue";
import TextEditable from "@main/Components/TextEditable.vue";
import { getFileName } from "@main/lib.js";

export default {
	name: "SendMessage",
	components: {
		Button,
		Input,
		SelectList,
		TextEditable,
	},
	data: function(){
		return {
			current_model_id: null,
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
			var items = [];
			for (var i=0; i<this.layout.agent_page.items.length; i++)
			{
				var item = this.layout.agent_page.items[i];
				items.push({
					"key": i,
					"value": item.name,
					"global": item.global,
				});
			}
			items.sort((a,b) => {
				/*if (a.global && !b.global) return -1;
				if (!a.global && b.global) return 1;*/
				return a.value.localeCompare(b.value);
			});
			return items;
		},
		models()
		{
			return this.layout.models_page.models;
		},
		files()
		{
			var chat = this.model.getCurrentChat();
			if (!chat) return [];
			
			return chat.getFiles();
		},
		chat()
		{
			return this.model.getCurrentChat();
		},
	},
	methods:
	{
		sendMessage()
		{
			var agent = this.layout.agent_page.items[this.model.current_agent_id];
			if (!agent) return;
			var model = this.models.find((item) => item.key == this.model.current_model_key);
			this.model.sendMessage({
				chat_id: this.model.current_chat_id,
				agent_id: this.model.current_agent_id,
				model: model ? model.model_name : "",
				model_name: model ? model.model_id : "",
				message: this.model.send_message
			});
			this.model.send_message = "";
		},
		stopChat()
		{
			this.model.stopChat();
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