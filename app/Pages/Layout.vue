<style lang="scss">
.list_item{
	display: flex;
	justify-content: space-between;
	gap: 10px;
	margin-bottom: 10px;
	&:last-child{
		margin-bottom: 0px;
	}
	&__name{
		flex: 1;
	}
	&__buttons{
		display: flex;
		justify-content: space-between;
		gap: 5px;
		span {
			cursor: pointer;
		}
	}
}
</style>

<template>
	<Agent v-show="layout.page == 'agent'" />
	<Chat v-show="layout.page == 'chat'" />
	<Settings v-show="layout.page == 'settings'" />
	<Models v-show="layout.page == 'models'" />
	<MCPServers v-show="layout.page == 'mcp_servers'" />
	<Rules v-show="layout.page == 'rules'" />
	<Memory v-show="layout.page == 'memory'" />
	<Usage v-show="layout.page == 'usage'" />
</template>

<script lang="js">
import Agent from "./Agent/Agent.vue";
import Chat from "./Chat/Chat.vue";
import Models from "./Models/Models.vue";
import MCPServers from "./MCPServers/MCPServers.vue";
import Rules from "./Rules/Rules.vue";
import Settings from "./Settings/Settings.vue";
import Memory from "./Memory/Memory.vue";
import Usage from "./Usage/Usage.vue";

export default {
	name: "Layout",
	components: {
		Agent,
		Chat,
		Models,
		MCPServers,
		Rules,
		Settings,
		Memory,
		Usage
	},
}
</script>
