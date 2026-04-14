<style lang="scss">
</style>

<template>
	<Agent v-show="layout.page == 'agent'" />
	<Chat v-show="layout.page == 'chat'" />
	<Settings v-show="layout.page == 'settings'" />
	<Models v-show="layout.page == 'models'" />
	<Rules v-show="layout.page == 'rules'" />
	<Memory v-show="layout.page == 'memory'" />
	<Usage v-show="layout.page == 'usage'" />
</template>

<script lang="js">
import Agent from "./Agent/Agent.vue";
import Chat from "./Chat/Chat.vue";
import Models from "./Models/Models.vue";
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
		Rules,
		Settings,
		Memory,
		Usage
	},
}
</script>
