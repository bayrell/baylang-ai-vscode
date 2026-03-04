import { createMessage } from "./Message.js";

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
		this.data["sender"] = message.sender;
	}
}

export class EndChatEvent extends ChatEvent
{
	constructor(chat, message)
	{
		super("end_chat");
		this.data["chat_id"] = chat.id;
		this.data["message_id"] = message.id;
		this.data["sender"] = message.sender;
	}
}

export class StepEvent extends ChatEvent
{
	constructor(chat, message)
	{
		super("step_chat");
		this.data["chat_id"] = chat.id;
		this.data["message_id"] = message.id;
		this.data["sender"] = message.sender;
	}
}

export class EndChunkEvent extends ChatEvent
{
	constructor(chat, message)
	{
		super("end_chunk");
		this.data["chat_id"] = chat.id;
		this.data["message_id"] = message.id;
		this.data["sender"] = message.sender;
	}
}

export class ToolEvent extends ChatEvent
{
	constructor(chat, tool)
	{
		super("tool_event");
		this.data["chat_id"] = chat.id;
		this.data["tool_name"] = tool.name;
	}
}

export class UpdateChatEvent extends ChatEvent
{
	constructor(chat, message)
	{
		super("update_chat");
		this.data["chat_id"] = chat.id;
		this.data["message_id"] = message.id;
		this.data["data"] = message.getData();
		this.data["sender"] = message.sender;
	}
}

export class ErrorChatEvent extends ChatEvent
{
	constructor(chat, error)
	{
		super("error_chat");
		this.data["chat_id"] = chat.id;
		this.data["error"] = error;
	}
}

export class Chat
{
	constructor()
	{
		this.id = 0;
		this.name = "";
		this.sender = "";
		this.messages = [];
	}
	
	
	/**
	 * Assign data
	 */
	assign(data)
	{
		this.id = data.id;
		this.name = data.name;
		this.sender = data.sender;
		if (data.messages)
		{
			this.messages = data.messages.map((data) => {
				return createMessage(data);
			});
		}
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