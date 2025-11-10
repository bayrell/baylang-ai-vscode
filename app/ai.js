import { minimatch } from "minimatch";
import { htmlUnescape, urlJoin, fetchEventSource, getErrorResponse } from "./lib.js";

export class Model
{
	constructor()
	{
		this.type = "";
		this.name = "";
		this.models = [];
		this.settings = {};
	}
	assign(data)
	{
		this.type = data.type;
		this.name = data.name;
		this.models = data.models;
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
	async loadModels()
	{
	}
}

export class OpenAIModel extends Model
{
	getUrl(path)
	{
		var url = this.settings.url != "" ? this.settings.url : "https://api.openai.com/v1/";
		return urlJoin(url, path);
	}
	
	
	/**
	 * Load models
	 */
	async loadModels()
	{
		var url = this.getUrl("models");
		if (!url)
		{
			throw new Error("Url not found");
		}
		
		try
		{
			var response = await fetch(url, {
				method: "GET",
				headers: {
					"Authorization": "Bearer " + this.getKey(),
					"Content-Type": "application/json"
				},
			});
			if (!response.ok)
			{
				throw new Error(await getErrorResponse(response));
			}
			
			var response_data = await response.json();
			var models = response_data.data;
			if (!models || !Array.isArray(models))
			{
				throw new Error("Models not found");
			}
			
			this.models = models;
		}
		catch (e)
		{
			throw e;
		}
	}
}

export class OpenRouterModel extends OpenAIModel
{
	getUrl(path)
	{
		return urlJoin("https://openrouter.ai/api/v1", path);
	}
}

export class GeminiModel extends OpenAIModel
{
	getUrl(path)
	{
		return urlJoin("https://generativelanguage.googleapis.com/v1beta/openai/", path);
	}
}

export class GrokModel extends OpenAIModel
{
	getUrl(path)
	{
		return urlJoin("https://api.x.ai/v1/", path);
	}
}

export class OllamaModel extends OpenAIModel
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
	else if (data.type == "openrouter") model = new OpenRouterModel();
	else if (data.type == "ollama") model = new OllamaModel();
	else if (data.type == "openai") model = new OpenAIModel();
	else if (data.type == "grok") model = new GrokModel();
	else model = new Model();
	model.assign(data);
	return model;
};

export class Agent
{
	constructor()
	{
		this.name = "";
		this.global = true;
		this.enable_rules = "1";
		this.default = {
			model: "",
			model_name: "",
		};
		this.model = null;
		this.model_name = "";
		this.prompt = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		if (data.name) this.name = data.name;
		if (data.global != undefined) this.global = data.global;
		if (data.enable_rules) this.enable_rules = data.enable_rules;
		if (data.default) this.default = data.default;
		if (data.model) this.model = data.model;
		if (data.model_name) this.model_name = data.model_name;
		if (data.prompt) this.prompt = data.prompt;
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return {
			name: this.name,
			global: this.global,
			enable_rules: this.enable_rules,
			default: this.default,
			model: this.model,
			model_name: this.model_name,
			prompt: this.prompt,
		};
	}
	
	
	/**
	 * Enable rules
	 */
	enableRules()
	{
		return this.enable_rules == "1";
	}
}

export function createAgent(data, settings)
{
	var agent = new Agent();
	agent.assign(data);
	agent.model = settings.getModelByName(data.model);
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
	constructor(block)
	{
		this.block = block || "";
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
	 * Returns true if empty
	 */
	isEmpty()
	{
		return this.content == "";
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		return this.content;
	}
	
	
	/**
	 * Add token
	 */
	addToken(token)
	{
		this.content += token;
	}
	
	
	/**
	 * Trim content
	 */
	trim()
	{
	}
}

export class TextItem extends MessageItem
{
	constructor()
	{
		super("text");
	}
}

export class CodeItem extends MessageItem
{
	constructor()
	{
		super("code");
		this.language = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(item)
	{
		super.assign(item);
		this.language = item.language;
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		var data = super.getData();
		data["language"] = this.language;
		return data;
	}
	
	
	/**
	 * Returns true if line is tag
	 */
	static isTag(line)
	{
		return line.trim().substring(0, 3) == "```";
	}
	
	
	/**
	 * Detect language
	 */
	detectLanguage()
	{
		var lines = this.content.split("\n");
		if (lines.length == 0) return;
		var line = lines[0].trim();
		this.language = line.substring(3);
	}
	
	
	/**
	 * Is end of block
	 */
	isBlockEnd()
	{
		var content = this.content.trim();
		return content.length >= 6 && content.substring(content.length - 3) == "```";
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		return "```" + this.language + "\n" + this.content + "```";
	}
	
	
	/**
	 * Trim content
	 */
	trim()
	{
		var lines = this.content.split("\n");
		if (lines.length > 0)
		{
			if (this.constructor.isTag(lines[0]))
			{
				lines = lines.slice(1);
			}
		}
		if (lines.length > 0)
		{
			if (this.constructor.isTag(lines[lines.length - 1]))
			{
				lines = lines.slice(0, -1);
			}
		}
		this.content = lines.join("\n");
	}
}

export class FileItem extends MessageItem
{
	constructor()
	{
		super("textfile");
		this.filename = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(item)
	{
		super.assign(item);
		this.filename = item.filename;
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		var data = super.getData();
		data["filename"] = this.filename;
		return data;
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		return "Filename: " + this.filename + "\n" + "```" + this.content + "```";
	}
}


/**
 * Convert item to message
 */
export function createMessageItem(item)
{
	var message_item = null;
	if (item.block == "text") message_item = new TextItem();
	else if (item.block == "code") message_item = new CodeItem();
	else if (item.block == "textfile") message_item = new FileItem();
	else message_item = new MessageItem();
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
		this.content = this.content.map((item) => createMessageItem(item));
	}
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		this.id = data.id;
		this.sender = data.sender;
		this.content = data.content ? data.content.map((item) => createMessageItem(item)) : [];
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
	 * Replace last item
	 */
	replaceLastItem(item)
	{
		this.content[this.content.length - 1] = item;
	}
	
	
	/**
	 * Add text item
	 */
	addTextItem(data)
	{
		var item = new TextItem();
		if (data != undefined)
		{
			item.assign(data);
		}
		this.content.push(item);
		return item;
	}
	
	
	/**
	 * Add new line
	 */
	addNewLine(last)
	{
		if (last instanceof TextItem)
		{
			if (CodeItem.isTag(last.content))
			{
				var new_item = new CodeItem();
				new_item.content = last.content;
				new_item.addToken("\n");
				new_item.detectLanguage();
				this.replaceLastItem(new_item);
				return new_item;
			}
		}
		if (last instanceof CodeItem)
		{
			if (!last.isBlockEnd())
			{
				last.addToken("\n");
				return last;
			}
		}
		if (!last.isEmpty())
		{
			return this.addTextItem();
		}
		return last;
	}
	
	
	/**
	 * Add chunk
	 */
	addChunk(chunk)
	{
		var last = this.getLastItem();
		if (last == null) last = this.addTextItem();
		for (var i=0; i<chunk.length; i++)
		{
			var char = chunk[i];
			if (char == "\n")
			{
				last = this.addNewLine(last);
			}
			else
			{
				last.addToken(char);
			}
		}
	}
	
	
	/**
	 * Trim
	 */
	trim()
	{
		for (var i=0; i<this.content.length; i++)
		{
			this.content[i].trim();
		}
	}
}

export class Rule
{
	constructor()
	{
		this.name = "";
		this.description = "";
		this.rules = "";
		this.content = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(item)
	{
		this.name = item.name || "";
		this.description = item.description || "";
		this.rules = item.rules || "";
		this.content = item.content;
	}
	
	
	/**
	 * Get data
	 */
	getData()
	{
		return {
			name: this.name,
			description: this.description,
			rules: this.rules,
			content: this.content,
		};
	}
	
	
	/**
	 * Convert rule to regexp
	 */
	static convertRule(rule, subfolder=true)
	{
		if (rule == "*") return new RegExp("^.*$");
		var pattern = rule.replace(new RegExp("[.+^${}()|[\]\\]", "g"), "\\$&");
		if (subfolder) pattern = pattern.replace(new RegExp("\\*\\*", "g"), ".*");
		else pattern = pattern.replace(new RegExp("\\*\\*\/", "g"), "");
		pattern = pattern.replace(new RegExp("\\*", "g"), "[^/]*");
		return new RegExp("^" + pattern + "$");
	}
	
	
	/**
	 * Match rule
	 */
	static match(filename, rule)
	{
		if (minimatch(filename, rule, { matchBase: true })) return true;
		return false;
	}
	
	
	/**
	 * Match file
	 */
	matchFile(filename)
	{
		var rules = this.getRules();
		for (var rule of rules)
		{
			if (this.constructor.match(filename, rule)) return true;
		}
		return false;
	}
	
	
	/**
	 * Returns rules
	 */
	getRules()
	{
		return this.rules.split(",").map(g => g.trim()).filter(g => g.length > 0);
	}
	
	
	/**
	 * Parse content
	 */
	parseContent(content)
	{
		this.rules = "";
		this.description = "";
		
		var match = content.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
		if (!match)
		{
			this.content = content;
			return;
		}
		
		var lines = match[1].split("\n");
		this.content = match[2].trim();
		
		for (var line of lines)
		{
			line = line.trim();
			if (!line) continue;
			
			var description = line.match(/^description:\s*(.*)$/i);
			if (description)
			{
				this.description = description[1].trim();
				continue;
			}
			
			var rules = line.match(/^globs:\s*(.*)$/i);
			if (rules)
			{
				this.rules = rules[1].trim();
				continue;
			}
		}
	}
	
	
	/**
	 * Returns content
	 */
	getContent()
	{
		var content = [
			"---"
		];
		if (this.description.length > 0)
		{
			content.push("description: " + this.description);
		}
		if (this.rules.length > 0)
		{
			content.push("globs: " + this.rules);
		}
		if (content.length > 1)
		{
			content.push("---");
			content.push("");
		}
		else content = [];
		content.push(this.content);
		return content.join("\n");
	}
}


/**
 * Create rule
 */
export function createRule(item)
{
	var rule = new Rule();
	rule.assign(item)
	return rule;
}


/**
 * Returns true if file matching
 */
export function ruleMatching(rule, message)
{
	if (!rule.rules) return true;
	for (var item of message.content)
	{
		if (!(item instanceof FileItem)) continue;
		if (rule.matchFile(item.filename)) return true;
	}
	return false;
}


/**
 * Filter rules
 */
export function filterRules(rules, message)
{
	return rules.filter(rule => {
		return ruleMatching(rule, message);
	});
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
                `<system>%rules%</system>` +
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
			if (content.length > 2 && content[0] == "%" && content[content.length - 1] == "%") continue;
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
		this.source = null;
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
		if (!this.agent.model)
		{
			await this.callback("error", new Error("Model not found"));
			return;
		}
		if (!this.agent.model_name)
		{
			await this.callback("error", new Error("Model name not found"));
			return;
		}
		
		var url = this.agent.model.getUrl("chat/completions");
		if (!url)
		{
			await this.callback("error", new Error("URL not found"));
			return;
		}
		
		await fetchEventSource(url, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + this.agent.model.getKey(),
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: this.agent.model_name,
				messages: this.prompt,
				stream: true
			}),
			onopen: async () => {
				await this.callback("step");
			},
			onmessage: async (data) => {
				if (data == "[DONE]") return;
				try
				{
					var chunk = JSON.parse(data);
					await this.callback("chunk", chunk);
				}
				catch (e){}
			},
			onerror: async (error) => {
				await this.callback("error", error);
			},
		});
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
		this.rules = [];
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
	 * Update rules
	 */
	async updateRules()
	{
		if (!this.agent.enableRules())
		{
			this.rules = [];
			return;
		}
		var rules = await this.settings.loadRules();
		this.rules = filterRules(rules, this.user_message);
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
			"rules": this.agent.enableRules() ? this.rules.map(rule => rule.content).join("\n\n") : "",
		});
	}
	
	
	/**
	 * Send prompt
	 */
	async sendPrompt(prompt)
	{
		console.log("Send prompt");
		console.log(prompt);
		var client = new Client(this.agent, prompt);
		client.setCallback(async (type, data) => {
			if (type == "error")
			{
				console.log(data);
				this.agent_message.addChunk("Error: " + data.message);
				await this.settings.saveChat(this.chat);
				this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
				this.provider.sendMessage(new ErrorChatEvent(this.chat, data));
			}
			else if (type == "step")
			{
				this.provider.sendMessage(new StepEvent(this.chat, this.agent_message));
			}
			else if (type == "chunk")
			{
				var token = data.choices[0]?.delta?.content || "";
				if (token != "") this.agent_message.addChunk(token);
				this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
				if (data.choices[0]?.finish_reason == "stop")
				{
					this.agent_message.trim();
					await this.settings.saveChat(this.chat);
					this.provider.sendMessage(new EndChunkEvent(this.chat, this.agent_message));
				}
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
		await this.sendPrompt(prompt);
		await this.settings.saveChat(this.chat);
		
		this.provider.sendMessage(new EndChatEvent(this.chat, this.agent_message));
	}
}