import { htmlUnescape, urlJoin } from "./lib.js";

export class Model
{
	constructor()
	{
		this.type = "";
		this.name = "";
		this.settings = {};
	}
	assign(data)
	{
		this.type = data.type;
		this.name = data.name;
		this.settings = data.settings;
	}
	getKey()
	{
		return this.settings["key"] || "";
	}
	getUrl()
	{
		return "";
	}
}

export class OpenAIModel extends Model
{
	getUrl(path)
	{
		return urlJoin("https://api.openai.com/v1/", path);
	}
}

export class GeminiModel extends Model
{
	getUrl(path)
	{
		return urlJoin("https://generativelanguage.googleapis.com/v1beta/openai/", path);
	}
}

export class OllamaModel extends Model
{
	getUrl(path)
	{
		if (this.settings.url == undefined) return "";
		return urlJoin(this.settings.url, path);
	}
}

export function createModel(data)
{
	var model = null;
	if (data.type == "gemini") model = new GeminiModel();
	else if (data.type == "ollama") model = new OllamaModel();
	else model = new Model();
	model.assign(data);
	return model;
};

export class Agent
{
	constructor()
	{
		this.name = "";
		this.model = null;
		this.model_name = "";
		this.prompt = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		this.name = data.name;
		this.model = data.model;
		this.model_name = data.model_name
		this.prompt = data.prompt;
	}
}

export function createAgent(data, settings)
{
	var agent = new Agent();
	agent.assign(data);
	agent.model = settings.getModelById(data.model);
	return agent;
};

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

export class UpdateChatEvent extends ChatEvent
{
	constructor(chat, message)
	{
		super("update_chat");
		this.data["chat_id"] = chat.id;
		this.data["message_id"] = message.id;
		this.data["content"] = message.getData().content;
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

export class MessageItem
{
	constructor(type)
	{
		this.block = type || "";
		this.content = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(item)
	{
		this.block = item.block;
		this.content = item.content;
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		return this.content;
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
	
	
	/**
	 * Add token
	 */
	addToken(token)
	{
		this.content += token;
	}
}

function convertMessageItem(item)
{
	var message_item = new MessageItem();
	message_item.assign(item);
	return message_item;
}

export class Message
{
	constructor(content)
	{
		this.id = 0;
		this.sender = "";
		this.content = content || [];
		this.content = this.content.map((item) => convertMessageItem(item));
	}
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		this.id = data.id;
		this.sender = data.sender;
		this.content = data.content ? data.content.map((item) => convertMessageItem(item)) : [];
	}
	
	
	/**
	 * Returns name
	 */
	getName()
	{
		if (this.sender == "agent") return "Agent";
		if (this.sender == "user") return "User";
		return this.sender;
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		var content = this.content.map((item) => item.getText());
		return content.join("\n\n");
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return {
			"id": this.id,
			"sender": this.sender,
			"content": this.content.map((item) => item.getData()),
		};
	}
	
	
	/**
	 * Returns last item
	 */
	getLastItem()
	{
		if (this.content.length == 0) return null;
		return this.content[this.content.length - 1];
	}
	
	
	/**
	 * Add token
	 */
	addToken(token)
	{
		if (this.content.length == 0) this.content = [new MessageItem("text")];
		var last_item = this.getLastItem();
		last_item.addToken(token);
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
				var message = new Message();
				message.assign(data);
				return message;
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

export class PromptBuilder
{
	constructor(prompt)
	{
		this.prompt = prompt
	}
	
	
	/**
	 * Add message
	 */
	addMessage(messages, tag, content)
	{
		messages.push({
			"role": tag,
			"content": content,
		});
	}
	
	
	/**
	 * Returns result
	 */
	getResult(variables)
	{
		var prompt = this.prompt;

        /* Create default prompt if tag not found */
        var matches = [...prompt.matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)];
        if (matches.length === 0) {
            prompt =
                `<system>${prompt}</system>` +
                `<system>%history%</system>` +
                `<user>%query%</user>`;
        }
		
		/* Add value to prompt */
		for (var key in variables)
		{
			var value = variables[key] || "";
			var pattern = new RegExp("%" + key + "%", "gi");
			if (key == "history" && value != "")
			{
				value = "History:\n" + value;
			}
			prompt = prompt.replace(pattern, value);
		}
		
		/* Find tags */
		var messages = [];
		matches = [...prompt.matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)];
		for (var key in matches)
		{
			var item = matches[key];
			var tag = item[1].toLowerCase();
			var content = item[2].trim();
			content = htmlUnescape(content);
			
			if (content == "") continue;
			this.addMessage(messages, tag, content);
		}
		
		return messages;
	}
}

export class Client
{
	constructor(agent, prompt)
	{
		this.agent = agent;
		this.prompt = prompt;
		this.callback = null;
	}
	
	
	/**
	 * Set callback
	 */
	setCallback(value)
	{
		this.callback = value;
	}
	
	
	/**
	 * Send
	 */
	async send()
	{
		if (!this.agent.model) return;
		
		var url = this.agent.model.getUrl("chat/completions");
		if (!url) return;
		
		var response = await fetch(url, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + this.agent.model.getKey(),
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: this.agent.model_name,
				messages: this.prompt,
				stream: true
			})
		});
		if (!response.ok)
		{
			var error = await response.text();
			await this.callback("error", error);
			return;
		}
		
		/* Begin response */
		await this.callback("step");
		var reader = response.body.getReader();
		var decoder = new TextDecoder("utf-8");
		while (true)
		{
			var { done, value } = await reader.read();
			if (done) break;
			
			var chunk = decoder.decode(value);
			var lines = chunk.split("\n").filter(line => line.trim() !== "");
			for (var line of lines)
			{
				if (line.startsWith("data: "))
				{
					var data = line.replace("data: ", "");
					if (data === "[DONE]") return;
					
					/* Parse chunk */
					chunk = null;
					try {
						var chunk = JSON.parse(data);
					}
					catch (e)
					{
						console.error("Error:", e);
					}
					
					/* Send chunk */
					if (chunk)
					{
						await this.callback("chunk", chunk);
					}
				}
			}
		}
	}
}

export class Question
{
	constructor()
	{
		this.agent = null;
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
		this.agent_message.sender = "agent";
		this.chat.messages.push(this.agent_message);
	}
	
	
	/**
	 * Add user message
	 */
	async addUserMessage(content)
	{
		this.user_message = new Message(content);
		this.user_message.id = this.chat.messages.length + 1;
		this.user_message.sender = "user";
		this.chat.messages.push(this.user_message);
	}
	
	
	/**
	 * Returns prompt
	 */
	getPrompt()
	{
		var builder = new PromptBuilder(this.agent.prompt);
		var history = this.chat.messages
			.filter((message) => message != this.user_message && message != this.agent_message)
			.map((message) => message.getName() + ":\n" + message.getText())
		;
		return builder.getResult({
			"query": this.user_message.getText(),
			"history": history.join("\n\n"),
		});
	}
	
	
	/**
	 * Send prompt
	 */
	async sendPrompt(prompt)
	{
		var client = new Client(this.agent, prompt);
		client.setCallback(async (type, data) => {
			if (type == "error")
			{
				console.log("Ошибка:", data);
				this.provider.sendMessage(new ErrorChatEvent(this.chat, data));
			}
			else if (type == "step")
			{
				this.provider.sendMessage(new StepEvent(this.chat, this.agent_message));
			}
			else if (type == "chunk" && data.choices[0]?.finish_reason == "stop")
			{
				await this.settings.saveChat(this.chat);
				this.provider.sendMessage(new EndChunkEvent(this.chat, this.agent_message));
			}
			else if (type == "chunk")
			{
				var token = data.choices[0]?.delta?.content || "";
				this.agent_message.addToken(token);
				this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
			}
		});
		await client.send();
	}
	
	
	/**
	 * Send message
	 */
	async send()
	{
		this.provider.sendMessage(new StartChatEvent(this.chat, this.agent_message));
		
		var prompt = this.getPrompt();
		console.log(prompt);
		await this.sendPrompt(prompt);
		await this.settings.saveChat(this.chat);
		
		this.provider.sendMessage(new EndChatEvent(this.chat, this.agent_message));
	}
}