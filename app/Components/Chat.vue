<style lang="scss" scoped>
.chat{
	display: flex;
	flex-direction: column;
	height: 100vh;
	padding-bottom: 20px;
}
.history{
	flex: 1;
}
.send_message{
	display: flex;
	align-items: stretch;
	input, button{
		padding: 5px 10px;
		border: 1px var(--border-color) solid;
		border-radius: 0;
	}
	input{
		flex: 1;
		border-right: 0;
	}
	button{
		cursor: pointer;
	}
}
</style>

<template>
	<div class="chat">
		<div class="history">
			<div v-for="message in getMessages()" class="history_item" :key="message">
				{{ message }}
			</div>
		</div>
		<div class="send_message">
			<input v-model="message" />
			<button @click="send">Send</button>
		</div>
	</div>
</template>

<script>
export default {
	name: "Chat",
	data: function(){
		return {
			message: "",
		};
	},
	methods: {
		getMessages()
		{
			return this.layout.history;
		},
		send: function(e)
		{
			this.layout.sendMessage(this.message);
			this.message = "";
		},
	},
};
</script>