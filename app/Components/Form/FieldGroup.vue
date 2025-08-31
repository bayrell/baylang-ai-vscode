<style lang="scss" scoped>
.field_group{
	display: flex;
	flex-direction: row;
}
.field_group :deep(.input){
	flex: 1;
	border-right-width: 0;
	border-top-right-radius: 0;
	border-bottom-right-radius: 0;
}
.field_group :deep(.button){
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}
</style>

<template>
	<div class="field_group">
		<slot></slot>
	</div>
</template>

<script lang="js">
export default {
	name: "FieldGroup",
};
</script>