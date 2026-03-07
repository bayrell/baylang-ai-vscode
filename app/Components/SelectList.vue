<style lang="scss" scoped>
.select_list{
	position: relative;
	color: var(--vscode-editor-foreground);
	&__value{
		display: flex;
		padding: 8px;
		gap: 4px;
		cursor: pointer;
		user-select: none;
		.text{
			flex: 1;
			white-space: nowrap;
			overflow: hidden;
		}
		.icon{
			width: 16px;
			height: 16px;
		}
	}
	&__items{
		position: absolute;
		display: none;
		background-color: var(--vscode-input-backgroud, white);
		border: 1px var(--border-color) solid;
		bottom: 0px;
		margin-bottom: 40px;
		min-width: 200px;
	}
	&.show .select_list__items{
		display: block;
	}
	&__item{
		padding: 8px;
		border-bottom: 1px var(--border-color) solid;
		cursor: pointer;
		user-select: none;
		&:hover{
			background-color: var(--hover-color);
		}
	}
	&__item:last-child{
		border-bottom-width: 0;
	}
}
:deep(body.vscode-dark){
	.select_list__item{
		background-color: var(--vscode-button-background);
	}
}
</style>

<template>
	<div class="select_list" :class="getClass" ref="select">
		<div class="select_list__value" @click="this.open = !this.open">
			<span class="text">{{ currentValue }}</span>
			<span class="icon">
				<img :src="layout.getImage('dropdown.svg')">
			</span>
		</div>
		<div class="select_list__items">
			<div class="select_list__item"
				@click="clickItem(null)"
			>
				{{ selectMessage }}
			</div>
			<div class="select_list__item"
				v-for="item in options"
				:key="item.key"
				@click="clickItem(item)"
			>
				{{ item.value }}
			</div>
		</div>
	</div>
</template>

<script>

export default {
	name: "SelectList",
	props: {
		name: {
			type: String,
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
			default: "",
		},
	},
	data: function()
	{
		return {
			open: false,
		};
	},
	emits: ["update:modelValue"],
	computed:
	{
		getClass: function()
		{
			var arr = [];
			if (this.open) arr.push("show");
			return arr.join(" ");
		},
		selected: function()
		{
			if (!this.modelValue) return "";
			return this.options.find((item) => item.key == this.modelValue);
		},
		currentValue: function()
		{
			if (!this.selected) return this.selectMessage;
			return this.selected.value;
		},
	},
	methods:
	{
		clickItem(item)
		{
			this.$emit("update:modelValue", item ? item.key : "");
			this.open = false;
		},
		onClick(event)
		{
			if (!this.open) return;
			var select = this.$refs["select"];
			var elem = event.target;
			while (elem != null)
			{
				if (elem == select)
				{
					return;
				}
				elem = elem.parentElement;
			}
			this.open = false;
		},
	},
	mounted: function()
	{
		document.addEventListener("click", this.onClick);
	},
	onUnmounted: function()
	{
		document.removeEventListener("click", this.onClick);
	}
}

</script>