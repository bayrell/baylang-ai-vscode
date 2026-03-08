<style lang="scss" scoped>
.texteditable{
	padding: 8px;
	background-color: var(--vscode-input-background, white);
	border: 1px solid var(--border-color);
	border-radius: 5px;
	color: var(--input-color);
	outline: none;
	&:focus{
		border-color: var(--vscode-focusBorder);
	}
}
</style>

<template>
	<div class="texteditable" ref="text"
		contenteditable="plaintext-only"
		@input="this.onInput"
	></div>
</template>

<script lang="js">

export default {
	name: "TextEditable",
	props: {
		name: {
			type: String,
		},
		modelValue: {
			type: String,
			default: "",
		},
	},
	data: function()
	{
		return {
			oldValue : "",
		};
	},
	emits: ["update:modelValue"],
	methods:
	{
		getValue()
		{
			return this.$refs["text"].innerText;
		},
		setValue(value)
		{
			var text = this.$refs["text"];
			text.innerText = value;
			this.oldValue = value;
		},
		onInput()
		{
			this.change();
		},
		change()
		{
			this.oldValue = this.getValue();
			this.$emit("update:modelValue", this.oldValue);
		},
	},
	mounted: function()
	{
		this.setValue(this.modelValue);
	},
	updated: function()
	{
		if (this.oldValue != this.modelValue)
		{
			this.setValue(this.modelValue);
		}
	},
}

</script>