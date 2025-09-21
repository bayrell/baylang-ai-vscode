<style lang="scss">
.button{
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	padding: 5px 10px;
	border: 1px solid transparent;
	font-size: var(--vscode-font-size, 13px);
	font-family: var(--vscode-font-family, sans-serif);
	white-space: nowrap;
	user-select: none;
	min-width: 70px;
	outline: none;
	&:hover{
		opacity: 0.9;
		/*background-color: var(--vscode-button-hoverBackground, var(--primary-color));*/
	}
	&:active{
		box-shadow: inset 0 2px 3px rgba(0,0,0,0.3);
	}
	&:disabled{
		opacity: 0.5;
		cursor: not-allowed;
	}
	&--primary{
		background-color: var(--vscode-button-background, var(--primary-color));
		color: var(--vscode-button-foreground, white);
		border-color: var(--vscode-button-border, transparent);
		/*&:hover{
			background-color: var(--vscode-button-hoverBackground, var(--primary-color));
		}*/
	}
	&--secondary{
		background-color: var(--vscode-button-secondaryBackground, var(--secondary-color));
		color: var(--vscode-button-secondaryForeground, white);
		border-color: var(--vscode-button-border, transparent);
		/*&:hover{
			background-color: var(--vscode-button-secondaryHoverBackground, var(--primary-color));
		}*/
	}
	&--danger{
		background-color: var(--vscode-inputValidation-errorBackground, var(--danger-color));
		color: var(--vscode-button-foreground, white);
		border-color: var(--vscode-button-border, transparent);
		/*&:hover{
			background-color: var(--vscode-inputValidation-errorBackground, var(--primary-color));
		}*/
	}
	&--success{
		background-color: var(--vscode-terminal-ansiGreen, var(--success-color));
		color: var(--vscode-button-foreground, white);
		border-color: var(--vscode-button-border, transparent);
		/*&:hover{
			background-color: var(--success-hover-background);
		}*/
	}
	&--gray{
		background-color: var(--vscode-input-background, var(--gray-color));
		color: var(--vscode-foreground, white);
		border-color: var(--border-color);
		/*&:hover{
			background-color: var(--vscode-toolbar-hoverBackground, var(--gray-color));
		}*/
	}
	&--default{
		background-color: white;
		color: var(--text-color);
		border: 1px solid var(--border-color);
		/*&:hover{
			background-color: #eee;
		}*/
	}
	&--back{
		background-color: var(--vscode-button-background, var(--primary-color));
		color: var(--vscode-button-foreground, white);
		border-color: var(--vscode-button-border, transparent);
		/*&:hover{
			background-color: var(--vscode-button-hoverBackground, var(--primary-color));
		}*/
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
body.vscode-dark{
	.button--default{
		background-color: var(--vscode-button-secondaryBackground, white);
		color: var(--vscode-button-secondaryForeground, var(--text-color));
		border: 1px solid var(--vscode-button-border, var(--border-color));
		/*&:hover{
			background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground, white));
		}*/
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