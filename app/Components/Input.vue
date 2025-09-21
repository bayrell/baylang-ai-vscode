<style lang="scss" scoped>
.input{
	padding: 8px;
	background-color: var(--vscode-input-background, white);
	border: 1px solid var(--border-color);
	border-radius: 5px;
	color: var(--vscode-input-foreground, black);
	outline: 0;
	width: 100%;
	&::placeholder{
		color: var(--vscode-input-placeholderForeground, #a6a6a6);
	}
	&:focus{
		border-color: var(--vscode-focusBorder, var(--border-color));
	}
}
textarea.input{
	min-height: 50px;
}
</style>

<template>
	<input
		v-if="type == 'input'"
		v-bind="$attrs"
		:id="name"
		:name="name"
		:value="modelValue"
		:class="getInputClass()"
		@input="$emit('update:modelValue', $event.target.value)"
	>
	<select
		v-if="type == 'select'"
		v-bind="$attrs"
		:id="name"
		:name="name"
		:value="modelValue"
		:class="getInputClass()"
		@input="$emit('update:modelValue', $event.target.value)"
	>
		<option value="">{{ selectMessage }}</option>
		<option
			v-for="option in options"
			:key="option.key"
			:value="option.key"
		>{{ option.value }}</option>
	</select>
	<textarea
		v-if="type == 'textarea'"
		v-bind="$attrs"
		:id="name"
		:name="name"
		:value="modelValue"
		:class="getInputClass()"
		@input="$emit('update:modelValue', $event.target.value)"
	></textarea>
</template>

<script lang="js">
export default {
	name: "Input",
	props: {
		type: {
			type: String,
			default: "input",
		},
		name: {
			type: String,
			required: true,
		},
		options: {
			type: Array,
			default: [],
		},
		modelValue: {
			type: [String, Number],
			default: "",
		},
		selectMessage: {
			type: String,
			default: "Select value",
		},
	},
	emits: ["update:modelValue"],
	methods:
	{
		getInputClass()
		{
			return "input";
		}
	}
}
</script>