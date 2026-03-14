import path from "path";
import { promises as fs } from "fs";
import { Settings } from "./Settings.js";
import { Agent } from "../Ai/Agent.js";
import { Rule } from "../Ai/Rule.js";
import { Usage } from "../Ai/Usage.js";
import { registerTools } from "./Tools.js";
import { registerSendMessage } from "./SendMessage.js";

export class CommandRegistry
{
	constructor()
	{
		this.handlers = {};
		this.webview = null;
	}
	
	
	/**
	 * Register command
	 */
	register(command, handler)
	{
		this.handlers[command] = handler;
	}
	
	
	/**
	 * Handle message
	 */
	async handleMessage(message)
	{
		var request_id = message.request_id;
		var command = message.command;
		var payload = message.payload;
		
		/* Get handler */
		var handler = this.handlers[command];
		if (!handler)
		{
			this.webview.postMessage({
				request_id: request_id,
				error: "Command '" + command + "' not found",
			});
			return;
		}
		
		/* Call handler */
		var result = null;
		try
		{
			result = await handler(payload);
		}
		catch (error)
		{
			this.webview.postMessage({
				request_id: request_id,
				error: error.message,
				stack: error.stack,
			});
			return;
		}
		
		/* Send result */
		this.webview.postMessage({
			request_id: request_id,
			payload: result
		});
	}
}


/**
 * Register commands
 */
export async function registerCommands(provider)
{
	var registry = provider.registry;
	
	/* Init settings */
	var settings = new Settings(provider.globalStorageUri);
	await settings.loadData();
	
	/* Init tools */
	settings.tools = await registerTools(settings);
	
	/* Init usage */
	settings.usage = new Usage(settings);
	settings.usage.loadData();
	
	/* Questions */
	settings.questions = [];
	
	/* Register */
	registerSendMessage(settings, provider);
	
	/* Load chat */
	registry.register("load_chat", async () => {
		var items = await settings.loadChat();
		return {
			"success": true,
			"items": items.map(item => item.getData()),
		};
	});
	
	/* Load agent */
	registry.register("load_agents", async () => {
		var items = await settings.loadAgents();
		return {
			success: true,
			items: items.map(item => item.getData()),
		};
	});
	
	/* Save agent */
	registry.register("save_agent", async ({id, item}) => {
		if (id == undefined) id = null;
		var agent = new Agent();
		agent.assign(item);
		await settings.saveAgent(id, agent);
		return {
			success: true,
		};
	});
	
	/* Delete agent */
	registry.register("delete_agent", async (id) => {
		await settings.deleteAgent(id);
		return {
			success: true,
		};
	});
	
	/* Reload models */
	registry.register("reload_models", async (model_name) => {
		var model = settings.getModelByName(model_name);
		try
		{
			await model.loadModels();
		}
		catch (e)
		{
			return {
				success: false,
				message: e.message,
			};
		}
		await settings.saveModel(model.name, model);
		return {
			success: true,
			items: model.models,
		};
	});
	
	/* Load model */
	registry.register("load_models", async () => {
		var items = settings.loadModels();
		return {
			success: true,
			items: items,
		};
	});
	
	/* Save model */
	registry.register("save_model", async ({id, item}) => {
		await settings.saveModel(id, item);
		return {
			success: true,
		};
	});
	
	/* Delete model */
	registry.register("delete_model", async (id) => {
		await settings.deleteModel(id);
		return {
			success: true,
		};
	});
	
	/* Load rules */
	registry.register("load_rules", async () => {
		var items = await settings.loadRules();
		items = items.map(item => item.getData());
		return {
			success: true,
			items: items,
		};
	});
	
	/* Save rule */
	registry.register("save_rule", async (item) => {
		var rule = new Rule();
		rule.assign(item);
		await settings.saveRule(rule);
		return {
			success: true,
		};
	});
	
	/* Delete rule */
	registry.register("delete_rule", async (id) => {
		await settings.deleteRule(id);
		return {
			success: true,
		};
	});
	
	/* Stop chat */
	registry.register("stop_chat", async (chat_id) => {
		var question = questions.find((item) => item.chat.id == chat_id);
		if (!question)
		{
			return {
				success: false,
				message: "Chat not found",
			}
		}
		
		await question.stop();
		
		return {
			success: true,
		};
	});
	
	/* Rename chat */
	registry.register("rename_chat", async ({id, name}) => {
		var chat = await settings.loadChatById(id);
		if (!chat)
		{
			return {
				success: false,
			};
		}
		chat.name = name;
		await settings.saveChat(chat);
		return {
			success: true,
			id: id,
			name: name,
		};
	});
	
	/* Delete chat */
	registry.register("delete_chat", async (id) => {
		await settings.deleteChat(id);
		return {
			success: true,
			chat_id: id,
		}
	});
	
	/* Update chat files */
	registry.register("update_chat_files", async (message) => {
		return {
			success: true,
		};
	});
	
	/* Read files */
	registry.register("read_files", async (files) => {
		var result = [];
		for (var i=0; i<files.length; i++)
		{
			var file_path = files[i];
			try
			{
				var stat = await fs.stat(file_path);
				result.push({
					path: file_path,
					name: path.relative(settings.workspaceFolderPath, file_path),
					content: null,
					isDirectory: stat.isDirectory(),
				});
			}
			catch (err)
			{
				console.log(err);
			}
		}
		return {
			success: true,
			items: result,
		};
	});
	
	/* Load usage */
	registry.register("load_usage", async () => {
		return {
			success: true,
			total: settings.usage.total,
			items: settings.usage.items,
		};
	});
}
