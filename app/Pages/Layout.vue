<style lang="scss">
</style>

<template>
	<Chat v-show="layout.page == 'chat'" />
	<Settings v-show="layout.page == 'settings'" />
	<Models v-show="layout.page == 'models'" />
</template>

<script lang="js">
import Chat from "./Chat/Chat.vue";
import Models from "./Models/Models.vue";
import Settings from "./Settings/Settings.vue";

export default {
	name: "Layout",
	components: {
		Chat,
		Models,
		Settings
	},
}
</script>