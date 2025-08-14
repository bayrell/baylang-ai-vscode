import ChatMessage from "./ChatMessage.js";


class ChatHistory
{
	id = "";
	title = "";
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
	 * Add files
	 */
	addFiles(files)
	{
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