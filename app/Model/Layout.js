import ChatHistory from "./ChatHistory.js";
import ChatMessage from "./ChatMessage.js";
import { markRaw } from "vue";


class Layout
{	
	/**
	 * Constructor
	 */
	constructor()
	{
		this.chats = [];
		this.vscode = markRaw(acquireVsCodeApi());
	}
	
	
	/**
	 * Bind events
	 */
	bind()
	{
		window.addEventListener("message", this.onMessage.bind(this));
	}
	
	
	/**
	 * Find chat by id
	 */
	findChatById(id)
	{
		for (var i =0; i<this.chats.length; i++)
		{
			var chat = this.chats[i];
			if (chat.id == id)
			{
				return chat;
			}
		}
		return null;
	}
	
	
	/**
	 * Send message
	 */
	sendMessage(chat_id, message)
	{
		/* Find chat by id */
		var chat = this.findChatById(chat_id);
		if (!chat)
		{
			chat = new ChatHistory();
			chat.id = Date.now();
			chat.title = "Chat " + chat.id;
			this.chats.push(chat);
		}
		
		/* Create message */
		var item = new ChatMessage()
		item.sender = "human";
		item.message = message;
		
		/* Add message to history */
		chat.addMessage(item);
		return;
		
		/* Send message to backend */
		this.vscode.postMessage({
			"command": "sendMessage",
			"payload": {
				chat_id: chat_id,
				message: message,
			},
		});
	}
	
	
	/**
	 * On message
	 */
	onMessage(event)
	{
		var message = event.data;
		if (message.command == "load" && message.payload.code == 1)
		{
			var items = message.payload.data.items;
			for (var i=0; i<items.length; i++)
			{
				var item = items[i];
				var history = new ChatHistory();
				history.assign(item);
				this.chats.push(history);
			}
			console.log("Load chat");
		}
	}
	
	
	/**
	 * Load chats
	 */
	async load()
	{
		this.vscode.postMessage({
			"command": "load",
		});
	}
};

export default Layout;