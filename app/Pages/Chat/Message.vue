<style lang="scss" scoped>
.chat_message{
	position: relative;
	line-height: 1.39;
	margin-bottom: 15px;
	&__line{
		margin-bottom: 15px;
		&:last-child{
			margin-bottom: 0px;
		}
	}
}
.chat_message_icons{
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	margin-top: 5px;
	right: 5px;
	top: 5px;
}
.chat_message_icon{
	cursor: pointer;
	font-size: 1.2em;
	padding: 5px;
	box-sizing: content-box;
	border: 1px var(--border-color) solid;
	border-radius: 5px;
	transition: opacity 0.2s ease-in-out;
	width: 16px;
	height: 16px;
	&:hover {
		background-color: var(--hover-color);
	}
	&.disabled{
		opacity: 0.3;
	}
}
:deep(.chat_message_text){
	overflow-wrap: break-word;
	p {
		margin: 0;
		margin-bottom: 1em;
		&:last-child {
			margin-bottom: 0;
		}
	}
	h1, h2, h3, h4, h5, h6 {
		margin-top: 1em;
		margin-bottom: 1em;
		font-weight: bold;
	}
	h1 { font-size: 1.8em; }
	h2 { font-size: 1.5em; }
	h3 { font-size: 1.3em; }
	ul, ol, li {
		margin: 0; padding: 0;
		margin-top: 1em;
	}
	ul, ol {
		margin-left: 2em;
		margin-bottom: 1em;
		li {
			margin-bottom: 1em;
		}
	}
	blockquote {
		border-left: 4px solid var(--vscode-textBlockQuote-border, #ccc);
		padding-left: 10px;
		color: var(--vscode-foreground, #666);
		margin: 1em 0;
	}
	code {
		background-color: var(--vscode-textCodeBlock-background, #f0f0f0);
		padding: 2px 4px;
		border-radius: 3px;
		font-family: monospace;
	}
	pre {
		background-color: var(--vscode-textCodeBlock-background, #f0f0f0);
		padding: 10px;
		border-radius: 5px;
		overflow-x: auto;
		code {
			padding: 0;
			background-color: transparent;
		}
	}
	strong {
		font-weight: bold;
	}
	em {
		font-style: italic;
	}
	a {
		color: var(--vscode-textLink-foreground, #007bff);
		text-decoration: underline;
	}
	hr {
		border: none;
		border-top: 1px solid var(--vscode-editorWidget-border, #000);
		margin: 1em 0;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1em;
		th, td {
			border: 1px solid var(--vscode-editorWidget-border, #ddd);
			padding: 8px;
			text-align: left;
		}
		th {
			background-color: var(--vscode-list-hoverBackground, #f2f2f2);
			font-weight: bold;
		}
	}
}
.chat_main__message--human{
	border-radius: 10px;
	/*box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	border: 1px var(--border-color) solid;
	border-radius: 10px;*/
	padding: 10px 15px;
	margin-left: auto;
	margin-right: 0;
	max-width: 70%;
}
</style>

<template>
	<div class="chat_message" :class="getClassMessage()" v-if="this.message.sender=='agent'">
		<div v-for="item in lines" :key="item" class="chat_message__line">
			<MessageCode
				v-if="item.block == 'code'"
				:item="item"
			/>
			<div v-if="item.block == 'text' && item.html" 
				class="chat_message_text"
				v-html="item.html"
			></div>
			<div v-if="item.block == 'text' && !item.html" 
				class="chat_message_text"
			>{{ item.content }}</div>
		</div>
	</div>
	<div class="chat_message" :class="getClassMessage()" v-else>
		<div class="chat_message_lines">
			<div v-for="item in lines" :key="item" class="chat_message__line">
				<div v-if="item.block == 'code'" class="chat_message_text">
					```<br/>{{ item.content }}<br/>```
				</div>
				<div v-if="item.block == 'text'" class="chat_message_text">
					{{ item.content }}
				</div>
			</div>
		</div>
		<div class="chat_message_icons">
			<span class="chat_message_icon"
				:class="{'disabled': this.disableResend}" @click="resendMessage"
			>
				<img :src="this.layout.getImage('refresh.svg')" />
			</span>
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
	data: function(){
		return {
			disableResend: false,
		};
	},
	computed:
	{
		model()
		{
			return this.layout.chat_page;
		},
		lines()
		{
			return this.message.getLines();
		}
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
		},
		getUserMessage()
		{
			var content = this.lines.map((item) => item.content);
			return content.join("\n\n");
		},
		resendMessage()
		{
			var agent = this.layout.agent_page.items[this.model.current_agent_id];
			if (!agent) return;
			if (this.disableResend) return;
			this.disableResend = true;
			setTimeout(()=>{ this.disableResend = false; }, 10000);
			this.model.sendMessage(
				this.model.current_chat_id,
				this.model.current_agent_id,
				null,
				this.message.id
			);
		},
	},
};
</script>