<style lang="scss" scoped>
.chat_typing {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	color: #888;
	font-style: italic;
	&__dots span {
		display: inline-block;
		width: 6px;
		height: 6px;
		margin: 0 2px;
		background-color: #888;
		border-radius: 50%;
		animation: blink 1.5s infinite both;
	}
	&__dots span:nth-child(2) {
		animation-delay: 0.1s;
	}
	&__dots span:nth-child(3) {
		animation-delay: 0.2s;
	}
	@keyframes blink {
		0%, 80%, 100% {
			opacity: 0;
			transform: scale(0.8);
		}
		30% {
			opacity: 1;
			transform: scale(1.2);
		}
	}
}
</style>

<template>
	<div class="chat_typing">
		<div class="chat_typing__dots">
			<span></span>
			<span></span>
			<span></span>
		</div>
	</div>
</template>

<script lang="js">
export default {
	name: "ChatTyping",
}
</script>