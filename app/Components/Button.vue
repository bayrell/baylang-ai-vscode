<style lang="scss">
.button{
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	padding: 5px 10px;
	border: none;
	outline: none;
	&:hover{
		opacity: 0.9;
	}
	&:active{
		box-shadow: inset 0 2px 3px rgba(0,0,0,0.3);
	}
	&--primary{
		background-color: var(--primary-color);
		color: white;
	}
	&--secondary{
		background-color: var(--secondary-color);
		color: white;
	}
	&--danger{
		background-color: var(--danger-color);
		color: white;
	}
	&--success{
		background-color: var(--success-color);
		color: white;
	}
	&--gray{
		background-color: var(--gray-color);
		color: white;
	}
	&--default{
		background-color: white;
		color: var(--text-color);
		border: 1px solid var(--border-color);
	}
	&--small{
		padding: 5px 10px;
	}
	&--medium{
		padding: 6px 12px;
	}
	&--large{
		padding: 8px 16px;
	}
}
</style>

<template>
	<button
		class="button"
		:class="getClass()"
		:disabled="isDisabled()"
		@click="$emit('click')"
	>
		<slot></slot>
	</button>
</template>

<script lang="js">
export default {
	name: "Button",
	props: {
		class: {
			type: String,
			default: 'default',
		},
	},
	emits: ['click'],
	methods:
	{
		getClass()
		{
			var arr = this.class.split(" ");
			arr = arr.map((item)=>{ return "button--" + item });
			return arr.join(" ");
		},
		isDisabled()
		{
			var arr = this.class.split(" ");
			return arr.indexOf("disabled") != -1;
		},
	},
}
</script>