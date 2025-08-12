<style lang="scss">
.chat_message_code{
	position: relative;
	pre{
		margin: 0;
		padding: 10px;
		background-color: var(--hover-color);
		border-radius: 5px;
		overflow-x: auto;
		text-align: left;
		position: relative;
	}
	code{
		display: block;
		all: unset;
		white-space: pre;
	}
	.button--copy_button{
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 1;
		font-size: 12px;
	}
}
</style>

<template>
	<div class="chat_message_code">
		<Button class="copy_button small primary" @click="onCopyClick" :disabled="is_copying">
			{{ status }}
		</Button>
		<pre><code>{{ getCodeContent(content) }}</code></pre>
	</div>
</template>

<script lang="js">
import Button from "./Button.vue";

export default{
	name: "MessageCode",
	components: {
		Button,
	},
	props: {
		content: {
			type: String,
			required: true,
		},
	},
	data()
	{
		return {
			is_copying: false,
			status: 'Copy',
			timeout: null,
		};
	},
	methods:
	{
		getCodeContent(line)
		{
			var arr = line.split("\n");
			if (arr.length == 0) return 0;
			if (arr[0].substring(0, 3) == "```") arr.splice(0, 1);
			if (arr[arr.length - 1].substring(0, 3) == "```") arr.splice(arr.length - 1, 1);
			return arr.join("\n");
		},
		async copy()
		{
			const content = this.getCodeContent(this.content);
			if (!navigator.clipboard || !navigator.clipboard.writeText)
			{
				let text = document.createElement("textarea");
				text.value = content;
				text.style.position = "fixed";
				text.style.left = "-999px";
				text.style.top = "-999px";
				document.body.appendChild(text);
				text.focus();
				text.select();
				return new Promise((res, rej) => {
					document.execCommand('copy') ? res() : rej();
					text.remove();
				});
			}
			else
			{
				return navigator.clipboard.writeText(content);
			}
		},
		async onCopyClick()
		{
			this.is_copying = true;
			try
			{
				await this.copy();
				this.status = 'Ok';
				if (this.timeout)
				{
					clearTimeout(this.timeout);
				}
				this.timeout = setTimeout(() => {
					this.status = 'Copy';
					this.is_copying = false;
				}, 2000);
			}
			catch (err)
			{
				console.error(err);
				this.status = 'Error';
				this.is_copying = false;
			}
		}
	},
}
</script>