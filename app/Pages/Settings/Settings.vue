<style lang="scss" scoped>
.settings_page{
	padding-top: 5px;
	.buttons{
		display: flex;
		gap: 5px;
		margin-bottom: 5px;
	}
}
.settings_list{
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.settings_item{
	display: flex;
	justify-content: space-between;
	align-items: center;
	cursor: pointer;
	padding: 10px;
	background-color: var(--vscode-input-background, white);
	border: 1px solid var(--border-color);
	border-radius: 5px;
}
.settings_item .title{
	font-weight: bold;
	margin-bottom: 5px;
}
.settings_item .description{
	color: var(--input-color);
}
.settings_item .action{
	display: none;
	cursor: pointer;
	color: #0078d4;
}
</style>

<template>
	<div class="settings_page page">
		<div class="buttons">
			<Button class="back" @click="layout.setPage('chat')">Back</Button>
		</div>
		<div class="page_title">
			Settings
		</div>
		<div class="settings_list">
			<div class="settings_item" @click="layout.setPage('agent')">
				<div class="info">
					<div class="title">Agent</div>
					<div class="description">Manage AI agent configuration</div>
				</div>
				<div class="action">Configure</div>
			</div>
			<div class="settings_item" @click="layout.setPage('models')">
				<div class="info">
					<div class="title">Models</div>
					<div class="description">Manage AI models configuration</div>
				</div>
				<div class="action">Configure</div>
			</div>
			<div class="settings_item" @click="layout.setPage('rules')">
				<div class="info">
					<div class="title">Rules</div>
					<div class="description">Manage rules for AI interactions</div>
				</div>
				<div class="action">Configure</div>
			</div>
			<div class="settings_item" @click="layout.setPage('memory')">
				<div class="info">
					<div class="title">Memory</div>
					<div class="description">Manage memory URLs for agent</div>
				</div>
				<div class="action">Configure</div>
			</div>
			<div class="settings_item" @click="layout.setPage('usage')">
				<div class="info">
					<div class="title">Usage</div>
					<div class="description">View usage statistics</div>
				</div>
				<div class="action">View</div>
			</div>
		</div>
	</div>
</template>

<script lang="js">
import Button from "@main/Components/Button.vue";

export default {
	name: "Settings",
	components: {
		Button
	},
	computed: {
		layout()
		{
			return this.$root.layout;
		}
	}
};
</script>
