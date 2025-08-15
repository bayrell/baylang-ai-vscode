<style lang="scss">
</style>

<template>
	<Chat v-show="layout.page == 'chat'" />
	<Settings v-show="layout.page == 'settings'" />
</template>

<script lang="js">
import Chat from "./Chat/Chat.vue";
import Settings from "./Settings/Settings.vue";

export default {
	name: "Layout",
	components: {
		Chat,
		Settings
	},
}
</script>