<style lang="scss">
.usage_page{
	&__title {
		font-size: 1.8em;
		font-weight: bold;
	}
	&__section {
		padding: 1rem 0;
	}
	&__section_title {
		font-size: 1.5em;
		font-weight: 600;
		margin-top: 0;
		margin-bottom: 15px;
		color: var(--vscode-textLink-foreground);
		border-bottom: 1px solid var(--vscode-panel-border);
		padding-bottom: 10px;
	}
	&__total {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 10px;
	}
	&__total_item {
		display: flex;
		justify-content: space-between;
		padding: 8px 10px;
		background-color: var(--vscode-list-hoverBackground);
		border-radius: 3px;
		font-size: 0.9em;
	}
	&__total_value {
		color: var(--vscode-editor-foreground);
	}
	&__no_data {
		font-style: italic;
		color: var(--vscode-editorGhostText-foreground);
	}
	&__list{
		width: 100%;
		td{
			padding: 0.25rem;
		}
	}
	&__item{
		gap: 10px;
		margin-bottom: 0.5rem;
	}
	&__value{
		text-align: right;
	}
}
</style>

<template>
	<div class="usage_page">
		<div class="buttons">
			<Button class="back" @click="layout.setPage('settings')">Back</Button>
		</div>
		<div class="usage_page__section">
			<h2 class="usage_page__section_title">Total Usage</h2>
			<div class="usage_page__total" v-if="Object.keys(model.total).length">
				<div class="usage_page__total_item">
					<span class="usage_page__total_label">Total Cost:</span>
					<span class="usage_page__total_value">${{ model.total.cost ? model.total.cost.toFixed(4) : '0.0000' }}</span>
				</div>
				<div class="usage_page__total_item">
					<span class="usage_page__total_label">Input Tokens:</span>
					<span class="usage_page__total_value">{{ this.getTokens(model.total.input_tokens) }}</span>
				</div>
				<div class="usage_page__total_item">
					<span class="usage_page__total_label">Prompt Tokens:</span>
					<span class="usage_page__total_value">{{ this.getTokens(model.total.prompt_tokens) }}</span>
				</div>
				<div class="usage_page__total_item">
					<span class="usage_page__total_label">Total Tokens:</span>
					<span class="usage_page__total_value">{{ this.getTokens(model.total.tokens) }}</span>
				</div>
			</div>
			<p class="usage_page__no-data" v-else>No total usage data available.</p>
		</div>
		<div class="usage_page__section">
			<h2 class="usage_page__section_title">Monthly Usage</h2>
			<table class="usage_page__list"><tbody>
				<tr>
					<td></td>
					<td class="usage_page__value">Tokens</td>
					<td class="usage_page__value">Cost</td>
				</tr>
				<tr class="usage_page__item"
					v-for="item in usageItems"
					:key="item.key"
				>
					<td class="usage_page__label">
						{{ item.label }}
					</td>
					<td class="usage_page__value usage_page__value_tokens">
						{{ this.getTokens(item.value.tokens) }}
					</td>
					<td class="usage_page__value usage_page__value_cost">
						${{ item.value.cost.toFixed(4) }}
					</td>
				</tr>
			</tbody></table>
		</div>
	</div>
</template>

<script lang="js">
import Button from "../../Components/Button.vue";

export default {
	name: "Usage",
	components: {
		Button
	},
	computed: {
		model: function()
		{
			return this.layout.usage_page;
		},
		usageItems: function()
		{
			var result = [];
			var keys = Object.keys(this.model.items);
			keys.sort((a, b) => b - a);
			for (var i=0; i<keys.length; i++)
			{
				var key = keys[i];
				var year = Math.floor(key / 12);
				var month = key % 12;
				
				/* Buil item */
				var label = this.getMonthName(month) + " " + year;
				result.push({
					key: key,
					label: label,
					value: this.model.items[key],
				});
			}
			return result;
		},
	},
	methods: {
		getMonthName(month)
		{
			const names = [
				"January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December"
			];
			if (month >= 0 && month < 12) return names[month];
			return "";
		},
		getTokens(tokens)
		{
			if (tokens > 1000000) return Math.floor(tokens / 100000) / 10 + "M";
			if (tokens > 1000) return Math.floor(tokens / 1000) + "K";
			return tokens;
		},
	},
	mounted: function()
	{
		this.model.load();
	}
}

</script>