export class ChatEvent
{
	constructor(event)
	{
		this.data = {
			event: event
		};
	}
	getData()
	{
		return this.data;
	}
}

export class CreateChatEvent extends ChatEvent
{
	constructor(chat)
	{
		super("create_chat");
		this.data["chat_id"] = chat.id;
		this.data["chat_name"] = chat.name;
		this.data["messages"] = chat.messages.map((message) => message.getData());
	}
}

export class StartChatEvent extends ChatEvent
{
	constructor(chat, message)
	{
		super("start_chat");
		this.data["chat_id"] = chat.id;
		this.data["message_id"] = message.id;
	}
}


export class EndChatEvent extends ChatEvent
{
	constructor(chat, message)
	{
		super("end_chat");
		this.data["chat_id"] = chat.id;
		this.data["message_id"] = message.id;
	}
}

export class MessageItem
{
	constructor(item)
	{
		this.block = item.block;
		this.content = item.content;
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return {
			"block": this.block,
			"content": this.content,
		};
	}
}

function convertMessageItem(item)
{
	return new MessageItem(item);
}

export class Message
{
	constructor(content)
	{
		this.id = 0;
		this.content = content || [];
		this.content = this.content.map((item) => convertMessageItem(item));
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return {
			"id": this.id,
			"content": this.content.map((item) => item.getData()),
		};
	}
}

export class Chat
{
	constructor()
	{
		this.id = 0;
		this.name = "";
		this.messages = [];
	}
	
	
	/**
	 * Assign data
	 */
	assign(data)
	{
		this.id = data.id;
		this.name = data.name;
		this.messages = data.messages.map((message) => new Message(message));
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return {
			"id": this.id,
			"name": this.name,
			"messages": this.messages.map((message) => message.getData()),
		};
	}
}

export class Question
{
	constructor()
	{
		this.agent_message = null;
		this.user_message = null;
		this.chat = null;
		this.provider = null;
		this.settings = null;
	}
	
	
	/**
	 * Add agent message
	 */
	async addAgentMessage()
	{
		this.agent_message = new Message();
		this.agent_message.id = this.chat.messages.length + 1;
		this.chat.messages.push(this.agent_message);
	}
	
	
	/**
	 * Add user message
	 */
	async addUserMessage(content)
	{
		this.user_message = new Message(content);
		this.user_message.id = this.chat.messages.length + 1;
		this.chat.messages.push(this.user_message);
	}
	
	
	/**
	 * Send message
	 */
	async send()
	{
		this.provider.sendMessage(new StartChatEvent(this.chat, this.agent_message));
		this.provider.sendMessage(new EndChatEvent(this.chat, this.agent_message));
	}
}