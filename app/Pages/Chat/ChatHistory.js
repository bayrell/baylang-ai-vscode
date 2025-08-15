import ChatMessage from "./ChatMessage.js";


class ChatHistory
{
	id = "";
	title = "";
	files = [];
	messages = [];
	is_typing = false;
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		this.id = data.id;
		this.title = data.name;
		this.addMessages(data.messages);
	}
	
	
	/**
	 * Returns true if assistant is typing
	 */
	isTyping()
	{
		return this.is_typing;
	}
	
	
	/**
	 * Set typing
	 */
	setTyping(value)
	{
		if (this.is_typing == value) return;
		this.is_typing = value;
	}
	
	
	/**
	 * Find file by path
	 */
	findFile(path)
	{
		return this.files.findIndex((file) => file.path == path);
	}
	
	
	/**
	 * Add files
	 */
	addFiles(files)
	{
		/* Concat files */
		for (var i=0; i<files.length; i++)
		{
			var file = files[i];
			
			/* Find file */
			var index = this.findFile(file.path);
			if (index < 0)
			{
				this.files.push(file);
				continue;
			}
			
			var find = this.files[index];
			find.content = file.content;
		}
	}
	
	
	/**
	 * Sort file
	 */
	sortFiles()
	{
		this.files.sort((a, b) => {
			var nameA = a.path.toLowerCase();
			var nameB = b.path.toLowerCase();
			if (nameA < nameB) return -1;
			if (nameA > nameB) return 1;
			return 0;
		});
	}
	
	
	/**
	 * Remove file
	 */
	removeFile(path)
	{
		var index = this.findFile(path);
		if (index == -1) return;
		this.files.splice(index, 1);
	}
	
	
	/**
	 * Returns files
	 */
	getFiles()
	{
		return this.files.map((file) => file.path);
	}
	
	
	/**
	 * Add message
	 */
	addMessage(data)
	{
		var item = data;
		if (!(data instanceof ChatMessage))
		{
			item = new ChatMessage();
			item.assign(data);
		}
		this.messages.push(item);
	}
	
	
	/**
	 * Add messages
	 */
	addMessages(items)
	{
		for (var i=0; i<items.length; i++)
		{
			this.addMessage(items[i]);
		}
	}
	
	
	/**
	 * Find message
	 */
	findMessageById(id)
	{
		for (var i=0; i<this.messages.length; i++)
		{
			var message = this.messages[i];
			if (message.id == id)
				return message;
		}
		return null;
	}
	
	
	/**
	 * Update message
	 */
	updateMessage(message)
	{
		var item = this.findMessageById(message.id);
		if (!item)
		{
			this.addMessage(message);
		}
		else
		{
			item.content = message.content;
		}
	}
	
	
	/**
	 * Load history
	 */
	async load()
	{
		
	}
}

export default ChatHistory;