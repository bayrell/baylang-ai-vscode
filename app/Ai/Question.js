import path from "path";
import { promises as fs } from "fs";
import { Client } from "./Client.js";
import { StartChatEvent, UpdateChatEvent, ErrorChatEvent, StepEvent, EndChatEvent, EndChunkEvent } from "./Chat.js";
import { FileResult } from "./FileResult.js";
import { Message, ToolMessage } from "./Message.js";
import { filterRules, Rule } from "./Rule.js";
import { fileExists } from "../api.js";
import { splitItem, getFileWithoutExtension, delay } from "../lib.js";
import { PromptBuilder } from "./PromptBuilder.js";
import { ToolResult } from "./ToolResult.js";

export class Question
{
	constructor()
	{
		this.agent = null;
		this.agent_message = null;
		this.user_message = null;
		this.model = null;
		this.model_name = null;
		this.prompt = null;
		this.prompt_rules_index = -1;
		this.memory = [];
		this.chat = null;
		this.client = null;
		this.provider = null;
		this.folderPath = null;
		this.files = [];
		this.rules = [];
		this.loaded_rules = null;
		this.max_iter = 100;
		this.fallback_count = 5;
		this.settings = null;
		this.tools = null;
		this.tools_history = [];
		this.last_error = null;
		this.usage = null;
		this.debug = false;
		this.messages_count = 0;
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
	async addFiles(files)
	{
		for (var i=0; i<files.length; i++)
		{
			var file = files[i];
			var find = this.files.find((item) => item.name == file.name);
			if (file.isDirectory || find) continue;
			
			/* Add file */
			if (file instanceof FileResult) this.files.push(file);
			else
			{
				var obj = new FileResult();
				obj.path = file.path;
				obj.name = file.name;
				this.files.push(obj);
			}
		}
		
		/* If has prompt */
		if (this.prompt)
		{
			this.prompt.addFiles(files);
			await this.updateRules();
		}
	}
	
	
	/**
	 * Read files
	 */
	async readFiles()
	{
		for (var i=0; i<this.files.length; i++)
		{
			var file = this.files[i];
			if (file.readed || file.error) continue;
			
			/* Read file */
			await file.read();
		}
	}
	
	
	/**
	 * Read memory files from .vscode/memory folder
	 */
	async readMemory()
	{
		this.memory = [];
		const folder_path = path.join(this.folderPath, ".vscode", "memory");
		
		try
		{
			// Ensure directory exists
			try
			{
				await fs.access(folder_path);
			}
			catch
			{
				await fs.mkdir(folder_path, { recursive: true });
				return;
			}
			
			// Read all files from memory directory
			const files = await fs.readdir(folder_path);
			
			// Filter only .md files
			const file_list = files.filter(file => file.endsWith('.md'));
			
			// Read each memory file
			for (const file_name of file_list)
			{
				const file_path = path.join(folder_path, file_name);
				try
				{
					const content = await fs.readFile(file_path, "utf8");
					this.memory.push({
						name: getFileWithoutExtension(file_name),
						content: content
					});
				}
				catch (error)
				{
					console.error("Error reading memory file " + file_name + ":", error);
				}
			}
		}
		catch (error)
		{
			console.error("Error reading memory folder:", error);
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
	 * Init chat
	 */
	async initChat()
	{
		this.prompt = new PromptBuilder();
		
		/* Add prompt */
		this.prompt.addMessage("system", this.agent.prompt);
		
		/* Add current date */
		this.prompt.addCurrentDate();
		
		/* Add memory */
		const memory_content = this.memory
			.map((memory) => "Memory name: " + memory.name + "\n```" + memory.content + "```")
		;
		this.prompt.addMessage("system", memory_content);
		
		/* Add rules */
		if (this.agent.enableRules())
		{
			const rules_content = this.rules
				.map((rule) => rule.getRuleContent())
			;
			this.prompt.addMessage("system", rules_content);
			this.prompt_rules_index = this.prompt.messages.length - 1;
		}
		
		/* Add tools */
		if (this.agent.enableTools())
		{
			const tools_content = this.tools.items
				.map((tool) => tool.prompt)
				.filter((tool) => tool != "")
			;
			this.prompt.addMessage("system", tools_content);
		}
		
		/* Add history */
		for (let i=0; i<this.chat.messages.length; i++)
		{
			let message = this.chat.messages[i];
			if (message instanceof ToolMessage) continue;
			if (message == this.user_message || message == this.agent_message) continue;
			const sender = message.sender == "user" ? "user" : "assistant";
			this.prompt.addMessage(sender, message.getText());
		}
		
		/* Add files */
		if (this.files.length > 0)
		{
			if (this.debug)
			{
				for (let i=0; i<this.files.length; i++)
				{
					let file = this.files[i];
					if (file.virtual) continue;
					console.log(`Send file: ${file.name}, error: ${file.error}`);
					console.log(`Text: ${file.isText()}, Image: ${file.isImage()}`);
				}
			}
			this.prompt.addFiles(this.files);
		}
		
		/* Add user message */
		this.prompt.addMessage("user", this.user_message.getText());
	}
	
	
	/**
	 * Update rules prompt
	 */
	updateRulesPrompt()
	{
		if (this.prompt_rules_index == -1) return;
		const rules_content = this.rules
			.map((rule) => rule.getRuleContent())
		;
		this.prompt.messages[this.prompt_rules_index].content = rules_content;
	}
	
	
	/**
	 * Load rules
	 */
	async loadRules()
	{
		if (this.loaded_rules != null) return this.loaded_rules;
		
		/* Load rules from settings */
		this.loaded_rules = await this.settings.loadRules();
		
		/* Add rules */
		if (this.agent.rules && this.agent.rules.length > 0)
		{
			for (var i=0; i<this.agent.rules.length; i++)
			{
				/* Get item */
				var filename = this.agent.rules[i];
				if (!filename) continue;
				
				/* Get rule name */
				var fileinfo = path.parse(filename);
				var rulename = fileinfo.name;
				
				/* Add groups */
				if (filename[0] == "@")
				{
					var groupname = filename.substring(1);
					var grouprules = this.loaded_rules.filter((item) => {
						var groups = splitItem(item.groups);
						return groups.indexOf(groupname) >= 0;
					});
					for (var j=0; j<grouprules.length; j++)
					{
						var rule = grouprules[j];
						if (!rule.disable) rule.global = true;
					}
				}
				
				/* Add filename */
				else
				{
					var rule = null;
					if (filename.substring(0, 2) == "./")
					{
						var filepath = path.resolve(this.folderPath, filename);
						if (!await fileExists(filepath))
							continue;
						try
						{
							var content = await fs.readFile(filepath, "utf8");
							rule = new Rule();
							rule.name = filename;
							rule.parseContent(content);
							this.loaded_rules.push(rule);
						}
						catch (error)
						{
						}
					}
					else
					{
						rule = this.loaded_rules
							.find((item) => item.name == rulename && !item.disable)
						;
					}
					if (rule) rule.global = true;
				}
			}
		}
		
		return this.loaded_rules;
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
		
		/* Load rules */
		var rules = await this.loadRules();
		this.rules = filterRules(rules, this);
		
		/* Update prompt */
		this.updateRulesPrompt();
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
			console.log("Send prompt to " + this.model_name);
			console.log(prompt);
		}
		var tools = [];
		var tools_index = {};
		
		if (this.agent_message == null || this.agent_message instanceof ToolMessage)
		{
			this.addAgentMessage();
		}
		
		/* Create client */
		var client = new Client(this.model, this.model_name);
		client.prompt = prompt;
		client.providers = this.agent.providers;
		client.secure = this.agent.secure;
		client.tools = this.agent.enableTools() ? this.tools : null;
		
		/* Setup client */
		this.setClient(client);
		
		/* Client functions */
		let has_error = false;
		let is_new = true;
		client.setCallback(async (type, data) => {
			if (type == "error")
			{
				has_error = true;
				this.last_error = data;
				console.log(data);
				//this.sendError(data);
			}
			else if (type == "tool")
			{
				if (!is_new) this.provider.sendMessage(new StepEvent(this.chat, this.agent_message));
				is_new = true;
				for (var i=0; i<data.length; i++)
				{
					var item = data[i];
					var index = item.index;
					
					if (tools_index[index] == undefined)
					{
						var tool_result = new ToolResult();
						tool_result.id = item.id;
						tool_result.name = item.function?.name;
						tools.push(tool_result);
						tools_index[index] = tools.length - 1;
					}
					else
					{
						var tool_result = tools[tools_index[index]];
						tool_result.arguments += item.function.arguments;
					}
				}
			}
			else if (type == "chunk")
			{
				is_new = false;
				var token = data.choices[0]?.delta?.content || "";
				if (token != "")
				{
					this.agent_message.addChunk(token);
					this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
				}
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
		
		/* Setup client */
		this.setClient(null);
		
		/* End step */
		if (this.debug)
		{
			console.log("End step");
		}
		
		/* If has error */
		if (has_error) return false;
		
		/* Log tools */
		if (this.debug && tools.length > 0)
		{
			console.log(tools);
		}
		
		/* Add tools */
		this.prompt.addTools(tools);
		
		/* Add tools */
		this.tools_history = [];
		for (var i=0; i<tools.length; i++)
		{
			var tool_result = tools[i];
			var tool_name = tool_result.name;
			
			/* Find tool */
			tool_result.tool = this.tools.findTool(tool_name);
			if (!tool_result.tool)
			{
				tool_result.has_answer = true;
				tool_result.error = "Tool '" + tool_name + "' not found";
				await this.sendError(new Error(tool_result.error));
				continue;
			}
			
			/* Parse args */
			tool_result.parseArgs();
			this.tools_history.push(tool_result);
		}
		
		/* Success */
		return true;
	}
	
	
	/**
	 * Send prompt with fallback
	 */
	async sendPromptWithFallback(prompt)
	{
		let count = 0;
		while (this.is_work && count < this.fallback_count)
		{
			/* Send */
			let result = await this.sendPrompt(prompt);
			if (result) return;
			
			/* Wait */
			if (count + 1 < this.fallback_count) await delay((Math.random() * 20 + 5) * 1000);
			count++;
		}
		
		/* Stop work */
		this.is_work = false;
		this.sendError(this.last_error ? this.last_error : new Error("Connection timeout"));
	}
	
	
	/**
	 * Execute tool
	 */
	async executeTool(tool_result)
	{
		tool_result.answer = null;
		tool_result.has_answer = true;
		
		/* Check tool */
		if (tool_result.tool == null)
		{
			return;
		}
		
		/* Get tool */
		var tool = tool_result.tool;
		this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
		this.provider.sendMessage(new StepEvent(this.chat, this.agent_message));
		
		/* Execute tool */
		try
		{
			tool_result.answer = await tool.execute(tool_result.args, this);
			this.agent_message.tool_answer = tool_result.getAnswer();
		}
		catch (e)
		{
			console.log(e);
			tool_result.error = e.message;
			this.agent_message.tool_error = e.message;
			await this.sendError(new ErrorChatEvent(this.chat, e));
		}
		
		/* Add tool result */
		this.prompt.addToolResult(tool_result);
		
		/* Show debug */
		if (this.debug)
		{
			console.log("Run tool: " + tool.name);
			console.log(tool_result.args);
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
			if (!this.is_work) break;
			
			/* Get tool */
			var tool_result = this.tools_history[i];
			if (tool_result.has_answer) continue;
			
			/* Remove empty message */
			if (this.agent_message && this.agent_message.content.length == 0)
			{
				var index = this.chat.messages.findIndex((message) => message == this.agent_message);
				if (index >= 0)
				{
					this.chat.messages.splice(index, 1);
				}
			}
			
			/* Create tool message */
			this.addToolMessage();
			this.agent_message.setTool(tool_result);
			
			/* Send update chat event */
			this.provider.sendMessage(new UpdateChatEvent(this.chat, this.agent_message));
			
			/* Execute tool */
			await this.executeTool(tool_result);
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
		var model = this.model.name;
		if (this.debug)
		{
			console.log("Send prompt to " + model + " " + this.model_name);
			console.log(this.prompt.messages);
		}
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
			await this.sendPromptWithFallback(this.prompt.messages);
			
			/* Execute tools */
			if (!this.hasTools() || !this.is_work) break;
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
		if (!this.model)
		{
			this.sendError(new Error("Model not found"));
			return ;
		}
		
		if (this.agent_message == null)
		{
			this.addAgentMessage();
		}
		this.provider.sendMessage(new StartChatEvent(this.chat, this.agent_message));
		
		/* Log message */
		if (!this.debug)
		{
			console.log("Send prompt to " + this.model_name);
			console.log(this.prompt.messages);
		}
		
		/* Send message */
		await this.sendTools();
		//await this.debugPrompt();
		await this.settings.saveChat(this.chat);
		
		this.provider.sendMessage(new EndChatEvent(this.chat, this.agent_message));
	}
}