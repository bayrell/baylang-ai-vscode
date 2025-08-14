<style lang="scss">
.chat{
	display: flex;
	flex-direction: column;
	height: 100vh;
	padding-bottom: 20px;
	&--drag{
		border: 2px solid var(--primary-color);
	}
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
}
</style>

<template>
	<div class="chat" :class="getClassName()">
		<ChatList />
		<ChatDialog />
		<div class="chat__history" v-if="layout.show_dialog == ''" ref="history">
			<Message
				v-for="message in getMessages()"
				:key="message.id"
				:message="message"
				@update="scrollHistory"
			/>
			<ChatTyping v-if="currentItem && currentItem.isTyping()" />
		</div>
		<SendMessage />
	</div>
</template>

<script lang="js">
import ChatDialog from "./ChatDialog.vue";
import ChatList from "./ChatList.vue";
import ChatTyping from "./ChatTyping.vue";
import Message from "./Message.vue";
import SendMessage from "./SendMessage.vue";

export default {
	name: "Chat",
	components: {
		ChatDialog: ChatDialog,
		ChatList: ChatList,
		ChatTyping: ChatTyping,
		Message: Message,
		SendMessage: SendMessage,
	},
	computed: {
		currentItem()
		{
			return this.layout.getCurrentChat();
		},
	},
	mounted: function()
	{
		this.layout.load();
	},
	updated: function()
	{
		this.scrollHistory();
	},
	methods:
	{
		scrollHistory()
		{
			this.$nextTick(() => {
				var history = this.$refs["history"];
				if (history) history.scrollTop = history.scrollHeight;
			});
		},
		getClassName()
		{
			var arr = [];
			if (this.layout.is_drag) arr.push("chat--drag")
			return arr.join(" ");
		},
		getMessages()
		{
			var chat = this.layout.findChatById(this.layout.current_chat_id);
			if (!chat) return [];
			return chat.messages;
		}
	},
};
</script>