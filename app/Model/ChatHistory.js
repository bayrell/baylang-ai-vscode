import ChatMessage from "./ChatMessage.js";


class ChatHistory
{
	id = "";
	title = "";
	messages = [];
	
	
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
			item.text = message.text;
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