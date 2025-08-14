import Api from "./Api.js";
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
		this.api = null;
		this.agents = [];
		this.chats = [];
		this.current_agent_id = null;
		this.current_chat_id = null;
		this.is_drag = false;
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
		/* Create api */
		this.api = markRaw(new Api(this.vscode));
		this.api.bind();
		this.api.addListener(this.onMessage.bind(this));
		
		/* Drag start */
		document.body.addEventListener("dragenter", (event) => {
			event.preventDefault();
			event.stopPropagation();
			
			/* Start drag and drop */
			this.is_drag = true;
		}, true);
		
		/* Drag leave */
		document.body.addEventListener("dragleave", (event) => {
			event.preventDefault();
			event.stopPropagation();
			
			/* Stop drag and drop */
			this.is_drag = false;
		}, true);
		
		/* Drag drop */
		document.body.addEventListener("drop", async (event) => {
			event.preventDefault();
			event.stopPropagation();
			
			/* Stop drag and drop */
			this.is_drag = false;
			this.onDrop(event);
		}, true);
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
		if (this.chats.length == 0)
		{
			this.current_chat_id = "";
			return;
		}
		
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
	getCurrentChat()
	{
		return this.findChatById(this.current_chat_id);
	}
	
	
	/**
	 * Returns current chat id
	 */
	getCurrentChatId()
	{
		var chat = this.findChatById(this.current_chat_id);
		if (!chat) return "";
		return this.current_chat_id;
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
	 * Create chat
	 */
	createChat()
	{
		var chat = new ChatHistory();
		chat.id = Date.now();
		chat.title = "Chat";
		this.chats.push(chat);
		return chat;
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
	sendMessage(chat_id, agent_id, message)
	{
		/* Find chat by id */
		var chat = this.findChatById(chat_id);
		if (!chat)
		{
			chat = this.createChat();
		}
		
		/* Create message */
		var item = new ChatMessage()
		item.sender = "human";
		item.setContent(message);
		
		/* Add message to history */
		chat.addMessage(item);
		this.selectItem(chat.id);
		
		/* Set typing */
		chat.setTyping(true);
		
		/* Send message to backend */
		this.vscode.postMessage({
			"command": "send_message",
			"payload": {
				id: chat.id,
				agent: agent_id,
				name: chat.title,
				content: item.content,
			},
		});
	}
	
	
	/**
	 * On message
	 */
	onMessage(event)
	{
		var message = event.data;
		if (message.command == "update_chat")
		{
			var chat_id = message.payload.chat_id;
			var chat = this.findChatById(chat_id);
			if (!chat) return;
			
			chat.setTyping(false);
			chat.updateMessage({
				id: message.payload.message_id,
				sender: message.payload.sender,
				content: message.payload.content,
			});
		}
		else if (message.command == "start_chat" || message.command == "step_chat")
		{
			var chat_id = message.payload.chat_id;
			var chat = this.findChatById(chat_id);
			if (!chat) return;
			
			chat.setTyping(true);
		}
		else if (message.command == "update_title")
		{
			var chat_id = message.payload.chat_id;
			var chat = this.findChatById(chat_id);
			if (!chat) return;
			
			chat.title = message.payload.chat_name;
		}
		else if (message.command == "end_chat")
		{
			var chat_id = message.payload.chat_id;
			var chat = this.findChatById(chat_id);
			if (!chat) return;
			
			chat.setTyping(false);
		}
	}
	
	
	/**
	 * Load chats
	 */
	async load()
	{
		var result = await this.api.call("load");
		
		/* Load chat */
		if (result.chat.code > 0)
		{
			var items = result.chat.data.items;
			for (var i=0; i<items.length; i++)
			{
				var item = items[i];
				var history = new ChatHistory();
				history.assign(item);
				this.chats.push(history);
			}
		}
		
		/* Load agents */
		if (result.agents.code > 0)
		{
			this.agents = result.agents.data.items;
		}
		
		/* Success */
		this.loading = false;
		console.log("Load chat");
	}
	
	
	/**
	 * On drag drop
	 */
	async onDrop(event)
	{
		/* Get files */
		var files = [];
		for (var i=0; i<event.dataTransfer.items.length; i++)
		{
			var item = event.dataTransfer.items[i];
			if (item.kind == "string" && item.type == "text/plain")
			{
				files.push(new Promise(
					(resolve) => {
						item.getAsString((filename) => {
							resolve(filename);
						})
					}
				));
			}
		}
		
		/* Resolve files */
		files = await Promise.all(files);
		
		/* Read files */
		files = await this.api.call("read_files", files);
		
		/* Create chat */
		var chat = this.getCurrentChat();
		if (!chat)
		{
			chat = this.createChat();
			this.selectItem(chat.id);
		}
		chat.addFiles(files);
		
		/* Update files list */
		var result = await this.api.call("update_chat_files", {
			chat_id: chat.id,
			chat_name: chat.name,
			files: chat.getFiles(),
		});
		console.log(result);
	}
};

export default Layout;