<style lang="scss" scoped>
.field{
	margin-bottom: 5px;
	&:last-child{
		margin-bottom: 0px;
	}
}
.field :deep(label){
	display: block;
	margin-bottom: 5px;
}
.field :deep(.result){
	margin-top: 5px;
}
</style>

<template>
	<div class="field">
		<slot></slot>
		<Result v-if="error != null" :result="error" />
	</div>
</template>

<script lang="js">
import Result from "./Result.vue";

export default {
	name: "Field",
	components: {
		Result,
	},
	props: {
		error: {
			type: Object,
		},
	},
}
</script>