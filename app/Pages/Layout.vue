<style lang="scss">
</style>

<template>
	<Agent v-show="layout.page == 'agent'" />
	<Chat v-show="layout.page == 'chat'" />
	<Settings v-show="layout.page == 'settings'" />
	<Models v-show="layout.page == 'models'" />
</template>

<script lang="js">
import Agent from "./Agent/Agent.vue";
import Chat from "./Chat/Chat.vue";
import Models from "./Models/Models.vue";
import Settings from "./Settings/Settings.vue";

export default {
	name: "Layout",
	components: {
		Agent,
		Chat,
		Models,
		Settings
	},
}
</script>