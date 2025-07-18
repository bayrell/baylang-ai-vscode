<style lang="scss">
</style>

<template>
	<div :class="getClass(message)" :key="message.id">
		<p v-for="line in message.getLines()" :key="line">
			{{ line }}
		</p>
	</div>
</template>

<script lang="js">
export default {
	name: "Message",
	props: {
		message: {
			type: Object,
		}
	},
	updated: function()
	{
		this.$emit("update");
	},
	methods: {
		getClass()
		{
			var arr = ["chat__history_item"];
			if (this.message.sender == "assistant") arr.push("chat__history_item--assistant");
			else if (this.message.sender == "human") arr.push("chat__history_item--human");
			return arr;
		}
	},
};
</script>