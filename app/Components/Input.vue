<style lang="scss" scoped>
.input{
	padding: 8px;
	background-color: var(--vscode-input-background, white);
	border: 1px solid var(--border-color);
	border-radius: 5px;
	color: var(--input-color);
	outline: 0;
	width: 100%;
	&__password_wrapper {
		position: relative;
	}
	&__password_button {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		background: var(--vscode-input-background, white);
		border: none;
		color: var(--vscode-foreground, #cccccc);
		cursor: pointer;
		padding: 4px;
		padding-left: 8px;
		line-height: 1;
		img{
			display: none;
			height: 20px;
			width: 20px;
		}
		img.show{
			display: block;
		}
	}
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
		:name="name"
		:autocomplete="autocomplete"
		:value="modelValue"
		:class="getInputClass()"
		@input="$emit('update:modelValue', $event.target.value)"
	>
	<div v-if="type == 'password'" class="input__password_wrapper">
		<input
			v-bind="$attrs"
			:type="current_password_type"
			:name="name"
			:autocomplete="autocomplete"
			:value="modelValue"
			:class="getInputClass()"
			@input="$emit('update:modelValue', $event.target.value)"
		>
		<button class="input__password_button"
			@click="togglePasswordVisiblity"
		>
			<img :src="layout.getImage('x-circle.svg')" :class="password_visible ? 'show' : ''">
			<img :src="layout.getImage('info.svg')" :class="!password_visible ? 'show' : ''">
		</button>
	</div>
	<select
		v-if="type == 'select'"
		v-bind="$attrs"
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
		autocomplete: {
			type: String,
		},
	},
	emits: ["update:modelValue"],
	data: function(){
		return {
			"password_visible": false,
		};
	},
	computed: {
		current_password_type()
		{
			return this.password_visible ? 'text' : 'password';
		}
	},
	methods:
	{
		getInputClass()
		{
			return "input";
		},
		togglePasswordVisiblity()
		{
			this.password_visible = !this.password_visible;
		}
	}
}
</script>