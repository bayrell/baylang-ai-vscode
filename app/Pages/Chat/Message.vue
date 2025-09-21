<style lang="scss" scoped>
.chat_message{
	line-height: 1.39;
	&__line{
		margin-bottom: 15px;
	}
}
:deep(.chat_message_text){
	overflow-wrap: break-word;
	color: var(--vscode-foreground, black);
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
	text-align: right;
}
</style>

<template>
	<div class="chat_message" :class="getClassMessage()">
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
		}
	},
};
</script>