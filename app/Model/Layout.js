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
		this.current_chat_id = null;
		this.image_url = "";
		this.show_dialog = "";
		this.show_dialog_id = "";
		this.loading = true;
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
		for (var i = 0; i<this.chats.length; i++)
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
	 * Find chat index by id
	 */
	findChat(id)
	{
		for (var i = 0; i<this.chats.length; i++)
		{
			var chat = this.chats[i];
			if (chat.id == id)
			{
				return i;
			}
		}
		return -1;
	}
	
	
	/**
	 * Select chat
	 */
	selectChat(pos)
	{
		if (pos < 0) pos = 0;
		if (pos >= this.chats.length) pos = this.chats.length - 1;
		if (this.chats.length == 0) return;
		
		var chat = this.chats[pos];
		this.current_chat_id = chat.id;
	}
	
	
	/**
	 * Select item
	 */
	selectItem(id)
	{
		this.current_chat_id = id;
	}
	
	
	/**
	 * Returns current item
	 */
	getCurrentItem()
	{
		return this.findChatById(this.current_chat_id);
	}
	
	
	/**
	 * Set image url
	 */
	setImageUrl(url)
	{
		this.image_url = url;
	}
	
	
	/**
	 * Returns image path
	 */
	getImage(path)
	{
		return this.image_url + "/" + path;
	}
	
	
	/**
	 * Show edit
	 */
	showEdit(chat_id)
	{
		this.show_dialog = "edit";
		this.show_dialog_id = chat_id;
		this.current_chat_id = chat_id;
	}
	
	
	/**
	 * Show delete
	 */
	showDelete(chat_id)
	{
		this.show_dialog = "delete";
		this.show_dialog_id = chat_id;
		this.current_chat_id = chat_id;
	}
	
	
	/**
	 * Delete chat
	 */
	async deleteChat(chat_id)
	{
		/* Find chat by id */
		var chat_pos = this.findChat(chat_id);
		if (chat_pos == -1) return;
		
		/* Get chat */
		var chat = this.chats[chat_pos];
		if (!chat) return;
		
		/* Remove chat */
		this.chats.splice(chat_pos, 1);
		
		/* Select new chat */
		if (this.current_chat_id == chat_id)
		{
			this.selectChat(chat_pos);
		}
		
		/* Send message to backend */
		this.vscode.postMessage({
			"command": "delete_chat",
			"payload": {
				chat_id: chat_id,
			},
		});
	}
	
	
	/**
	 * Rename chat
	 */
	async renameChat(chat_id, new_name)
	{
		/* Find chat by id */
		var chat = this.findChatById(chat_id);
		if (!chat) return;
		
		/* Rename title */
		chat.title = new_name;
		
		/* Send message to backend */
		this.vscode.postMessage({
			"command": "rename_chat",
			"payload": {
				chat_id: chat_id,
				name: new_name,
			},
		});
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
			"command": "send_message",
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
			this.loading = false;
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