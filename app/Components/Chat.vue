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
		<div class="chat__select">
			<select v-model="current_chat_id">
				<option value="">Select chat</option>
				<option v-for="chat in getChats()" :key="chat.id" :value="chat.id">{{ chat.title }}</option>
			</select>
		</div>
		<div class="chat__history">
			<Message
				v-for="message in getMessages()"
				:key="message.id"
				:message="message"
			/>
		</div>
		<div class="chat__send_message">
			<input v-model="message" />
			<button @click="sendMessage">Send</button>
		</div>
	</div>
</template>

<script>
import Message from "./Message.vue";

export default {
	name: "Chat",
	components: {
		Message: Message,
	},
	data: function(){
		return {
			message: "",
			current_chat_id: "",
		};
	},
	mounted: function()
	{
		this.layout.load();
	},
	methods: {
		getChats()
		{
			return this.layout.chats;
		},
		getMessages()
		{
			var chat = this.layout.findChatById(this.current_chat_id);
			if (!chat) return [];
			return chat.messages;
		},
		sendMessage: function(e)
		{
			this.layout.sendMessage(this.current_chat_id, this.message);
			this.message = "";
		},
	},
};
</script>