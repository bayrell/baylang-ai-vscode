<style lang="scss" scoped>
.chat{
	display: flex;
	flex-direction: column;
	height: 100vh;
	padding-bottom: 20px;
	&__drag-overlay {
		position: absolute;
		top: 0; left: 0;
		right: 0; bottom: 0;
		background-color: rgba(var(--primary-color-rgb), 0.15);
		border: 3px dashed var(--primary-color);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--primary-color);
		font-size: 1.6rem;
		font-weight: 600;
		text-align: center;
		z-index: 100;
		pointer-events: none;
		user-select: none;
		gap: 15px;
		&__icon {
			font-size: 4rem;
		}
		&__text {
			padding: 0 20px;
		}
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
		<div class="chat__history" v-if="model.show_dialog == ''" ref="history">
			<Message
				v-for="message in messages"
				:key="message.id"
				:message="message"
				@update="scrollHistory"
			/>
			<ChatTyping v-if="currentItem && currentItem.isTyping()" />
		</div>
		
		<div v-if="model.is_drag"
			class="chat__drag-overlay"
		>
			<span class="chat__drag-overlay__icon">
				&#x2B07;
			</span>
			<span class="chat__drag-overlay__text">
				Drop File
			</span>
		</div>
		
		<SendMessage />
	</div>
</template>

<script lang="js">
import ChatTyping from "@main/Components/ChatTyping.vue";
import ChatDialog from "./ChatDialog.vue";
import ChatList from "./ChatList.vue";
import Message from "./Message.vue";
import SendMessage from "./SendMessage.vue";

export default {
	name: "Chat",
	components: {
		ChatDialog,
		ChatList,
		ChatTyping,
		Message,
		SendMessage,
	},
	computed: {
		model()
		{
			return this.layout.chat_page;
		},
		currentItem()
		{
			return this.model.getCurrentChat();
		},
		messages()
		{
			var chat = this.model.findChatById(this.model.current_chat_id);
			if (!chat) return [];
			return chat.messages;
		},
	},
	mounted: function()
	{
		this.model.load();
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
			if (this.model.is_drag) arr.push("chat--drag")
			return arr.join(" ");
		}
	},
};
</script>