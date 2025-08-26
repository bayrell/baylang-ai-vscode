<style lang="scss" scoped>
.chat_message{
	line-height: 1.35;
	&__line{
		margin-bottom: 15px;
	}
}
.chat_message_text{
	overflow-wrap: break-word;
}
.chat_main__message--human{
	text-align: right;
}
</style>

<template>
	<div class="chat_message" :class="getClassMessage()">
		<div v-for="line in message.getLines()" :key="line" class="chat_message__line">
			<MessageCode v-if="line.block == 'code'" :content="line.content" />
			<div v-if="line.block == 'text'" class="chat_message_text">
				{{ line.content }}
			</div>
		</div>
	</div>
</template>

<script lang="js">
import MessageCode from "./MessageCode.vue";

export default {
	name: "Message",
	components: {
		MessageCode,
	},
	props: {
		message: {
			type: Object,
		}
	},
	computed:
	{
		model()
		{
			return this.layout.chat_page;
		},
	},
	updated: function()
	{
		this.$emit("update");
	},
	methods: {
		getClassMessage()
		{
			if (this.message.sender == "agent") return "chat_main__message--assistant";
			else if (this.message.sender == "user") return "chat_main__message--human";
			return "";
		}
	},
};
</script>