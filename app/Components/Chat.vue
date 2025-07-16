<style lang="scss">
.chat{
	display: flex;
	flex-direction: column;
	height: 100vh;
	padding-bottom: 20px;
	&__history{
		flex: 1;
		overflow-y: auto;
		padding-top: 10px;
		padding-bottom: 10px;
		padding-right: 10px;
		&_item{
			line-height: 1.35;
			p{
				margin-bottom: 15px;
			}
		}
		&_item:last-child{
			padding-bottom: 0px;
		}
		&_item--human{
			text-align: right;
		}
	}
	&__send_message{
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
		button{
			cursor: pointer;
		}
	}
}
</style>

<template>
	<div class="chat">
		<ChatList />
		<ChatDialog />
		<div class="chat__history" v-if="layout.show_dialog == ''">
			<Message
				v-for="message in getMessages()"
				:key="message.id"
				:message="message"
			/>
		</div>
		<div class="chat__send_message">
			<input v-model="message" />
			<Button @click="sendMessage">Send</Button>
		</div>
	</div>
</template>

<script>
import Button from "./Button.vue";
import ChatDialog from "./ChatDialog.vue";
import ChatList from "./ChatList.vue";
import Message from "./Message.vue";

export default {
	name: "Chat",
	components: {
		Button: Button,
		ChatDialog: ChatDialog,
		ChatList: ChatList,
		Message: Message,
	},
	data: function(){
		return {
			message: "",
		};
	},
	mounted: function()
	{
		this.layout.load();
	},
	methods: {
		getMessages()
		{
			var chat = this.layout.findChatById(this.layout.current_chat_id);
			if (!chat) return [];
			return chat.messages;
		},
		sendMessage()
		{
			this.layout.sendMessage(this.layout.getCurrentChatId(), this.message);
			this.message = "";
		},
	},
};
</script>