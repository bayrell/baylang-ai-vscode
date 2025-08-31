<style lang="scss" scoped>
.result{
	&--success{
		color: var(--success-color);
	}
	&--error{
		color: var(--danger-color);
	}
}
</style>

<template>
	<div class="result" :class="getClass()">
		{{ result.message }}
	</div>
</template>

<script lang="js">
import Result from "./Result.js";

export default {
	name: "Result",
	props: {
		result: {
			type: Result,
			required: true,
		},
	},
	methods: {
		getClass()
		{
			if (!this.result) return "";
			if (this.result.code < 0) return "result--error";
			if (this.result.code > 0) return "result--success";
			return "";
		}
	},
};
</script>