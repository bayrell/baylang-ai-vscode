import { relative } from "path";
import { fetchEventSource, htmlUnescape } from "../lib.js";
import { StartChatEvent, UpdateChatEvent, ErrorChatEvent, StepEvent, EndChatEvent } from "./Chat.js";
import { Message, FileItem } from "./Message.js";
import { filterRules } from "./Rule.js";

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
				`<system>%files%</system>` +
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
	constructor(model, model_id)
	{
		this.model = model;
		this.model_id = model_id;
		this.prompt = null;
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
		if (!this.model)
		{
			await this.callback("error", new Error("Model not found"));
			return;
		}
		if (!this.model_id)
		{
			await this.callback("error", new Error("Model name not found"));
			return;
		}
		
		var url = this.model.getUrl("chat/completions");
		if (!url)
		{
			await this.callback("error", new Error("URL not found"));
			return;
		}
		
		await fetchEventSource(url, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + this.model.getKey(),
				"Content-Type": "application/json",
				"HTTP-Referer": "https://baylang.com/",
				"X-Title": "BayLang AI",
			},
			body: JSON.stringify({
				model: this.model_id,
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
		this.model = null;
		this.chat = null;
		this.provider = null;
		this.folderPath = null;
		this.files = [];
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
	 * Add files
	 */
	addFiles(files)
	{
		this.files = files;
		for (var i=0; i<files.length; i++)
		{
			this.files[i].filename = relative(this.folderPath, this.files[i].path);
		}
	}
	
	
	/**
	 * Remove chat history
	 */
	removeChatHistory(message_id)
	{
		var user_message = null;
		var index = this.chat.messages.findIndex((message) => { return message.id == message_id });
		if (index >= 0)
		{
			user_message = this.chat.messages[index];
			this.chat.messages.splice(index + 1);
		}
		return user_message;
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
		this.rules = filterRules(rules, this.files);
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
			"files": this.files.map((file) => {
				var item = new FileItem();
				item.assign(file);
				return item.getText();
			}).join("\n\n"),
			"rules": this.agent.enableRules() ?
				this.rules.map(rule => rule.getRuleContent()).join("\n\n") : "",
		});
	}
	
	
	/**
	 * Send prompt
	 */
	async sendPrompt(prompt)
	{
		console.log("Send prompt");
		console.log(prompt);
		var client = new Client(this.model, this.agent.model_name);
		client.prompt = prompt;
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
	 * Debug prompt
	 */
	async debugPrompt(prompt)
	{
		console.log("Send prompt");
		console.log(prompt);
		this.agent_message.addChunk("Ok");
		this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
	}
	
	
	/**
	 * Send message
	 */
	async send()
	{
		this.provider.sendMessage(new StartChatEvent(this.chat, this.agent_message));
		
		var prompt = this.getPrompt();
		await this.sendPrompt(prompt);
		//await this.debugPrompt(prompt);
		await this.settings.saveChat(this.chat);
		
		this.provider.sendMessage(new EndChatEvent(this.chat, this.agent_message));
	}
}