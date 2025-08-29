<style lang="scss" scoped>
.settings_page{
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: center;
	gap: 10px;
	padding-top: 5px;
	.item{
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px #ccc solid;
		padding: 20px;
		cursor: pointer;
	}
}
</style>

<template>
	<div class="settings_page">
		<div class="item" @click="layout.setPage('agent')">Agent</div>
		<!--<div class="item">Index</div>-->
		<!--<div class="item">MCP</div>-->
		<div class="item" @click="layout.setPage('models')">Models</div>
		<div class="item" @click="layout.setPage('rules')">Rules</div>
	</div>
</template>

<script lang="js">
export default {
	name: "Settings",
};
</script>