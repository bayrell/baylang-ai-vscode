import { Client } from "./Client.js";
import { StartChatEvent, UpdateChatEvent, ErrorChatEvent, StepEvent, EndChatEvent, EndChunkEvent } from "./Chat.js";
import { Message, FileItem, ToolMessage } from "./Message.js";
import { filterRules } from "./Rule.js";

export class PromptBuilder
{
	constructor(prompt)
	{
		this.prompt = prompt;
	}
	
	
	/**
	 * Add message
	 */
	addMessage(messages, tag, content)
	{
		if (!content) return;
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
		var messages = [];
		
		/* Add system rules */
		this.addMessage(messages, "system", this.prompt);
		
		/* Add rules */
		if (variables.rules)
		{
			var rules = variables.rules.map(rule => rule.getRuleContent());
			if (rules.length > 0) this.addMessage(messages, "system", rules.join("\n\n"));
		}
		
		/* Add tools prompt */
		if (variables.tools)
		{
			var content = variables.tools.items
				.map((tool) => tool.prompt)
				.filter((item) => item != "")
			;
			if (content.length > 0)
			{
				/*this.addMessage(messages, "system", "Tools rules:\n\n" + content.join("\n\n"));*/
			}
		}
		
		/* Add history */
		this.addMessage(messages, "system", variables.history);
		
		/* Add files */
		var files = variables.files.map((file) => {
			var item = new FileItem();
			item.assign(file);
			return item.getText();
		});
		if (files.length > 0) this.addMessage(messages, "system", files.join("\n\n"));
		
		/* Add user message */
		this.addMessage(messages, "user", variables.query);
		
		/* Add tools history */
		if (variables.tools_history && variables.tools_history.length > 0)
		{
			messages.push({
				role: "assistant",
				tool_calls: variables.tools_history.map((tool) =>({
					type: "function",
					id: tool.id,
					function: tool.function,
				})),
			});
			for (var i=0; i<variables.tools_history.length; i++)
			{
				var tool = variables.tools_history[i];
				var content = "";
				if (!tool.error)
				{
					content = JSON.stringify(tool.answer);
				}
				else
				{
					content = "Error: " + JSON.stringify(tool.error);
				}
				messages.push({
					role: "tool",
					tool_call_id: tool.id,
					name: tool.function.name,
					content: content,
				});
			}
		}
		
		return messages;
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
		this.client = null;
		this.provider = null;
		this.folderPath = null;
		this.files = [];
		this.rules = [];
		this.max_iter = 100;
		this.settings = null;
		this.tools = null;
		this.tools_history = [];
		this.usage = null;
		this.debug = true;
		this.is_work = true;
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
	 * Add tool message
	 */
	async addToolMessage()
	{
		this.agent_message = new ToolMessage();
		this.agent_message.id = this.chat.messages.length + 1;
		this.chat.messages.push(this.agent_message);
	}
	
	
	/**
	 * Add files
	 */
	addFiles(files)
	{
		this.files = files;
		for (var i=0; i<files.length; i++)
		{
			this.files[i].filename = this.files[i].name;
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
		var history = [];
		for (var i=0; i<this.chat.messages.length; i++)
		{
			var message = this.chat.messages[i];
			if (message instanceof ToolMessage)
			{
				var find = this.tools_history.find((item) => item == message.tool);
				if (!find)
				{
					history.push("Execute: " + message.tool_name + "\nAnswer: " + message.tool_answer);
				}
			}
			else if (message != null)
			{
				if (message != this.user_message && message != this.agent_message)
				{
					history.push(message.getName() + ":\n" + message.getText());
				}
			}
		}
		return builder.getResult({
			"query": this.user_message.getText(),
			"history": history.join("\n\n"),
			"files": this.files,
			"rules": this.agent.enableRules() ? this.rules : null,
			"tools": this.agent.enableTools() ? this.tools : null,
			"tools_history": this.tools_history,
		});
	}
	
	
	/**
	 * Set client
	 */
	setClient(client)
	{
		this.client = client;
	}
	
	
	/**
	 * Send error
	 */
	async sendError(error)
	{
		console.log(error);
		this.agent_message.addChunk("Error: " + error.message);
		await this.settings.saveChat(this.chat);
		this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
		this.provider.sendMessage(new ErrorChatEvent(this.chat, error));
	}
	
	
	/**
	 * Send prompt
	 */
	async sendPrompt(prompt)
	{
		/* Show debug */
		if (this.debug)
		{
			console.log("Send prompt");
			console.log(prompt);
		}
		var tools = [];
		var tools_index = {};
		
		/* Create client */
		var client = new Client(this.model, this.agent.model_name);
		this.setClient(client);
		client.prompt = prompt;
		client.tools = this.tools;
		
		/* Client functions */
		client.setCallback(async (type, data) => {
			if (type == "error")
			{
				this.sendError(data);
			}
			else if (type == "tool")
			{
				for (var i=0; i<data.length; i++)
				{
					var item = data[i];
					var index = item.index;
					
					if (tools_index[index] == undefined)
					{
						tools.push({
							id: item.id,
							function: item.function,
							answer: null,
							error: null,
						});
						tools_index[index] = tools.length - 1;
					}
					else
					{
						var elem = tools[tools_index[index]];
						elem.function.arguments += item.function.arguments;
					}
				}
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
				if (data.usage)
				{
					this.usage.add(data.usage);
					await this.usage.save();
				}
			}
		});
		
		/* Send message */
		this.provider.sendMessage(new StepEvent(this.chat, this.agent_message));
		await client.send();
		
		/* Log tools */
		if (this.debug && tools.length > 0)
		{
			console.log(tools);
		}
		
		/* Add tools */
		for (var i=0; i<tools.length; i++)
		{
			var item = tools[i];
			var tool_name = item.function?.name;
			
			/* Find tool */
			var tool = this.tools.findTool(tool_name);
			if (!tool)
			{
				await this.sendError(new Error("Tool '" + tool_name + "' not found"));
				continue;
			}
			
			/* Parse args */
			var args = item.function?.arguments;
				try
			{
				args = JSON.parse(args);
			}
			catch (e)
			{
				args = null;
			}
			
			this.tools_history.push(Object.assign(item, { tool: tool, args: args }));
		}
	}
	
	
	/**
	 * Execute tool
	 */
	async executeTool(item)
	{
		item.answer = null;
		item.has_answer = true;
		
		/* Check tool */
		if (item.tool == null)
		{
			return;
		}
		
		/* Get tool */
		var tool = item.tool;
		this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
		this.provider.sendMessage(new StepEvent(this.chat, this.agent_message));
		
		/* Execute tool */
		try
		{
			item.answer = await tool.execute(item.args);
			this.agent_message.tool_answer = JSON.stringify(item.answer);
		}
		catch (e)
		{
			console.log(e);
			item.error = e.message;
			this.agent_message.tool_error = e.message;
			await this.sendError(new ErrorChatEvent(this.chat, e));
		}
		
		/* Show debug */
		if (this.debug)
		{
			console.log("Run tool: " + tool.name);
			console.log(item.args);
		}
		
		/* Save chat */
		this.provider.sendMessage(new EndChunkEvent(this.chat, this.agent_message));
		await this.settings.saveChat(this.chat);
	}
	
	
	/**
	 * Execute tools
	 */
	async executeTools()
	{
		for (var i=0; i<this.tools_history.length; i++)
		{
			var item = this.tools_history[i];
			if (item.has_answer) continue;
			
			/* Remove empty message */
			if (this.agent_message && this.agent_message.content.length == 0)
			{
				var index = this.chat.messages.findIndex((message) => message == this.agent_message);
				if (index >= 0)
				{
					this.chat.messages.splice(index);
				}
			}
			
			/* Create tool message */
			this.addToolMessage();
			this.agent_message.setTool(item);
			
			/* Send update chat event */
			this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
			
			/* Execute tool */
			await this.executeTool(item);
		}
		if (this.tools_history.length > 0)
		{
			this.addAgentMessage();
		}
	}
	
	
	/**
	 * Returns true if has tools for execute
	 */
	hasTools()
	{
		return this.tools_history.find((item) => !item.has_answer);
	}
	
	
	/**
	 * Stop question
	 */
	async stop()
	{
		console.log("Stop", this);
		
		this.is_work = false;
		if (this.client)
		{
			this.client.signal.abort();
		}
		
		this.provider.sendMessage(new EndChatEvent(this.chat, this.agent_message));
	}
	
	
	/**
	 * Debug prompt
	 */
	async debugPrompt()
	{
		console.log("Send prompt");
		console.log(this.getPrompt());
		this.agent_message.addChunk("Ok");
		this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
		this.provider.sendMessage(new EndChatEvent(this.chat, this.agent_message));
	}
	
	
	/**
	 * Send message with tools
	 */
	async sendTools()
	{
		var count = 0;
		while (this.is_work)
		{
			/* Send message */
			var prompt = this.getPrompt();
			await this.sendPrompt(prompt);
			
			/* Execute tools */
			if (!this.hasTools()) break;
			await this.executeTools();
			
			count++;
			if (count > this.max_iter) break;
		}
	}
	
	
	/**
	 * Send message
	 */
	async send()
	{
		this.provider.sendMessage(new StartChatEvent(this.chat, this.agent_message));
		
		await this.sendTools();
		//await this.debugPrompt();
		await this.settings.saveChat(this.chat);
		
		this.provider.sendMessage(new EndChatEvent(this.chat, this.agent_message));
	}
}