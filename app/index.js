const ai = require("./ai.js");
const lib = require("./lib.js");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const vscode = require("vscode");

async function fileExists(file_path)
{
	try
	{
		await fs.access(file_path);
		return true;
	}
	catch
	{
		return false;
	}
}

function activate(context)
{
	/* Register provider */
	var provider = new BayLangViewProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(provider.getId(), provider, {
			webviewOptions: {
				retainContextWhenHidden: true,
			}
		})
	);
	
	/* Show chat */
	context.subscriptions.push(
		vscode.commands.registerCommand("baylang-ai.showChat", () => {
			if (provider.panel)
			{
				provider.panel.webview.postMessage({ command: "show_page", page: "chat" });
			}
		})
	);
	
	/* Show settings */
	context.subscriptions.push(
		vscode.commands.registerCommand("baylang-ai.showSettings", () => {
			if (provider.panel)
			{
				provider.panel.webview.postMessage({ command: "show_page", page: "settings" });
			}
		})
	);
}

function makeHash(item)
{
	return crypto.createHash('md5').update(item).digest('hex');
}

class Settings
{
	constructor(globalStorageUri)
	{
		this.folderPath = globalStorageUri.path;
		this.filePath = path.join(this.folderPath, "settings.json");
		this.data = {};
		this.agents = [];
		this.workspaceFolderPath = "";
		this.workspaceFolderHash = "";
		if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
		{
			var folder = vscode.workspace.workspaceFolders[0];
			this.workspaceFolderPath = lib.removeLastSlash(folder.uri.fsPath);
			this.workspaceFolderHash = makeHash(this.workspaceFolderPath);
		}
	}
	
	
	/**
	 * Load data
	 */
	async loadData()
	{
		/* Load global settings */
		try
		{
			var raw = await fs.readFile(this.filePath, "utf-8");
			this.data = JSON.parse(raw);
		}
		catch (e)
		{
			this.data = {};
		}
		
		/* Load agents */
		await this.loadLocalAgents();
	}
	
	
	/**
	 * Save data
	 */
	async saveData()
	{
		/* Create folder if does not exists */
		if (!await fileExists(this.folderPath))
		{
			await fs.mkdir(this.folderPath, { recursive: true });
		}
		
		/* Write file */
		await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
	}
	
	
	/**
	 * Load agents
	 */
	async loadAgents()
	{
		await this.loadLocalAgents();
		var convert = (agents, global) => agents.map((item) => {
			var agent = new ai.Agent();
			agent.assign(item);
			agent.global = global;
			return agent;
		});
		var agents = [];
		if (this.data.agents)
		{
			agents = agents.concat(convert(this.data.agents, true));
		}
		agents = agents.concat(convert(this.agents, false));
		return agents;
	}
	
	
	/**
	 * Load local agents
	 */
	async loadLocalAgents()
	{
		/* Read project agents */
		try
		{
			var file_name = path.join(this.workspaceFolderPath, ".vscode", "agents.json");
			var raw = await fs.readFile(file_name, "utf-8");
			this.agents = JSON.parse(raw);
		}
		catch (e)
		{
			this.agents = [];
		}
		
		/* Read custom settings */
		try
		{
			var file_name = path.join(this.getChatFolderPath(), "agents.json");
			var raw = await fs.readFile(file_name, "utf-8");
			var items = JSON.parse(raw);
			for (var i=0; i<items.length; i++)
			{
				var item = items[i];
				var agent = this.agents.find((obj) => obj.name == item.name);
				if (agent)
				{
					agent.default = {
						model: agent.model,
						model_name: agent.model_name,
					};
					agent.model = item.model;
					agent.model_name = item.model_name;
				}
			}
		}
		catch (e)
		{
		}
	}
	
	
	/**
	 * Save local agents
	 */
	async saveLocalAgents()
	{
		var folder_path = path.join(this.workspaceFolderPath, ".vscode");
		var file_path = path.join(folder_path, "agents.json");
		
		/* Create folder if does not exists */
		if (!await fileExists(folder_path))
		{
			await fs.mkdir(folder_path, { recursive: true });
		}
		
		/* Write project file */
		var agents = this.agents.map((agent) => {
			var obj = Object.assign({}, agent);
			if (obj.default)
			{
				if (obj.default.model) obj.model = obj.default.model;
				if (obj.default.model_name) obj.model_name = obj.default.model_name;
				delete obj.default;
			}
			return obj;
		});
		await fs.writeFile(file_path, JSON.stringify(agents, null, 2));
		
		/* Write custom file */
		file_path = path.join(this.getChatFolderPath(), "agents.json");
		await fs.writeFile(file_path, JSON.stringify(this.agents, null, 2));
	}
	
	
	/**
	 * Get agent by name
	 */
	getAgentByName(name, global)
	{
		if (global)
		{
			if (!this.data.agents) return null;
			var agent = this.data.agents.find((item) => item.name == name);
			if (!agent) return null;
			return ai.createAgent(agent, this);
		}
		var agent = this.agents.find((item) => item.name == name);
		if (!agent) return null;
		return ai.createAgent(agent, this);
	}
	
	
	/**
	 * Save agent
	 */
	async saveAgent(id, item)
	{
		if (item.global)
		{
			if (!this.data.agents) this.data.agents = [];
			var index = this.data.agents.findIndex((agent) => agent.name == id);
			var data = item.getData();
			delete data["default"];
			delete data["global"];
			if (index == -1) this.data.agents.push(data);
			else this.data.agents[index] = data;
			await this.saveData();
		}
		else
		{
			await this.loadLocalAgents();
			var index = this.agents.findIndex((agent) => agent.name == id);
			var data = item.getData();
			delete data["default"];
			delete data["global"];
			if (index == -1)
			{
				data.default = {
					model: data.model,
					model_name: data.model_name,
				};
				this.agents.push(data);
			}
			else 
			{
				var agent = this.agents[index];
				agent.name = data.name;
				agent.enable_rules = data.enable_rules;
				agent.model = data.model;
				agent.model_name = data.model_name;
				agent.prompt = data.prompt;
			}
			await this.saveLocalAgents();
		}
	}
	
	
	/**
	 * Delete agent
	 */
	async deleteAgent(name, global)
	{
		if (global)
		{
			if (!this.data.agents) return;
			
			var index = this.data.agents.findIndex((agent) => agent.name == name);
			if (index != -1) this.data.agents.splice(index, 1);
			await this.saveData();
		}
		else
		{
			var index = this.agents.findIndex((agent) => agent.name == name);
			if (index != -1) this.agents.splice(index, 1);
			await this.saveLocalAgents();
		}
	}
	
	
	/**
	 * Load models
	 */
	loadModels()
	{
		return this.data.models ? this.data.models : []
	}
	
	
	/**
	 * Returns model by name
	 */
	getModelByName(name)
	{
		if (!this.data.models) return null;
		var model = this.data.models.find((item) => item.name == name);
		if (!model) return null;
		return ai.createModel(model);
	}
	
	
	/**
	 * Save model
	 */
	async saveModel(id, item)
	{
		if (!this.data.models) this.data.models = [];
		var index = this.data.models.findIndex((agent) => agent.name == id);
		if (index == -1) this.data.models.push(item);
		else this.data.models[index] = item;
		await this.saveData();
	}
	
	
	/**
	 * Delete model
	 */
	async deleteModel(name)
	{
		if (!this.data.models) return;
		
		var index = this.data.models.findIndex((model) => model.name == name);
		if (index != -1) this.data.models.splice(index, 1);
		await this.saveData();
	}
	
	
	/**
	 * Load rules
	 */
	async loadRules()
	{
		if (!await fileExists(this.workspaceFolderPath))
		{
			return;
		}
		
		var folderPath = path.join(this.workspaceFolderPath, ".vscode", "rules");
		var files = [];
		try
		{
			files = await fs.readdir(folderPath);
		}
		catch (e){}
		
		files = files.filter(file => file.endsWith(".rule"))
			.map(file => path.basename(file, ".rule"));
		files.sort();
		files = await Promise.all(files.map((file_name) => this.loadRule(file_name)));
		files = files.filter(file => file != null);
		return files;
	}
	
	
	/**
	 * Load rule
	 */
	async loadRule(rule_name)
	{
		if (!await fileExists(this.workspaceFolderPath))
		{
			return;
		}
		
		var folderPath = path.join(this.workspaceFolderPath, ".vscode", "rules");
		var filePath = path.join(folderPath, rule_name + ".rule");
		var content = "";
		try
		{
			content = await fs.readFile(filePath, "utf-8");
		}
		catch (e)
		{
			return null;
		}
		
		var rule = new ai.Rule();
		rule.name = rule_name;
		rule.parseContent(content);
		return rule;
	}
	
	
	/**
	 * Save rule
	 */
	async saveRule(item)
	{
		if (!await fileExists(this.workspaceFolderPath))
		{
			return;
		}
		
		var folderPath = path.join(this.workspaceFolderPath, ".vscode", "rules");
		var filePath = path.join(folderPath, item.name + ".rule");
		if (!await fileExists(folderPath))
		{
			await fs.mkdir(folderPath, { recursive: true });
		}
		
		await fs.writeFile(filePath, item.getContent());
	}
	
	
	/**
	 * Delete rule
	 */
	async deleteRule(rule_name)
	{
		if (!await fileExists(this.workspaceFolderPath))
		{
			return;
		}
		
		var folderPath = path.join(this.workspaceFolderPath, ".vscode", "rules");
		var filePath = path.join(folderPath, rule_name + ".rule");
		if (!fileExists(filePath)) return;
		try
		{
			fs.unlink(filePath);
		}
		catch (e){}
	}
	
	
	/**
	 * Returns chat folder
	 */
	getChatFolderPath()
	{
		if (this.workspaceFolderHash == "") return path.join(this.folderPath, "chat");
		return path.join(this.folderPath, "chat", this.workspaceFolderHash);
	}
	
	
	/**
	 * Load chat
	 */
	async loadChat()
	{
		var folderPath = this.getChatFolderPath();
		var files = [];
		try
		{
			files = await fs.readdir(folderPath);
		}
		catch (e){}
		
		files = files.filter(file => file.endsWith(".json"))
			.filter(file => file != "agents.json")
			.filter(file => file != "settings.json")
			.map(file => path.basename(file, ".json"));
		files.sort();
		files = await Promise.all(files.map((file_name) => this.loadChatById(file_name)));
		files = files.filter(file => file != null);
		return files;
	}
	
	
	/**
	 * Load chat by id
	 */
	async loadChatById(chat_id)
	{
		var chat = null;
		var data = null;
		var folderPath = this.getChatFolderPath();
		var filePath = path.join(folderPath, chat_id + ".json");
		try
		{
			const raw = await fs.readFile(filePath, "utf-8");
			data = JSON.parse(raw);
		}
		catch (e)
		{
			return null;
		}
		
		if (data != null)
		{
			chat = new ai.Chat();
			chat.assign(data);
		}
		return chat;
	}
	
	
	/**
	 * Save chat
	 */
	async saveChat(chat)
	{
		var folderPath = this.getChatFolderPath();
		if (!await fileExists(folderPath))
		{
			await fs.mkdir(folderPath, { recursive: true });
		}
		
		var filePath = path.join(folderPath, chat.id + ".json");
		await fs.writeFile(filePath, JSON.stringify(chat.getData(), null, 2));
	}
	
	
	/**
	 * Delete chat
	 */
	async deleteChat(chat_id)
	{
		var folderPath = this.getChatFolderPath();
		var filePath = path.join(folderPath, chat_id + ".json");
		if (!fileExists(filePath)) return;
		try
		{
			fs.unlink(filePath);
		}
		catch (e){}
	}
}


class CommandRegistry
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
async function registerCommands(provider)
{
	var registry = provider.registry;
	var settings = new Settings(provider.globalStorageUri);
	await settings.loadData();
	
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
		var agent = new ai.Agent();
		agent.assign(item);
		await settings.saveAgent(id, agent);
		return {
			success: true,
		};
	});
	
	/* Delete agent */
	registry.register("delete_agent", async ({id, global}) => {
		await settings.deleteAgent(id, global);
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
		var rule = new ai.Rule();
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
	
	/* Send message */
	registry.register("send_message", async (message) => {
		
		/* Find agent by id */
		var agent = settings.getAgentByName(message.agent, message.global);
		if (!agent)
		{
			return {
				success: false,
				message: "Agent not found",
			}
		}
		
		/* Create question */
		var question = new ai.Question();
		question.agent = agent;
		question.provider = provider;
		question.settings = settings;
		
		/* Load chat by id */
		question.chat = await settings.loadChatById(message.id);
		if (!question.chat)
		{
			question.chat = new ai.Chat();
			question.chat.id = message.id;
			question.chat.name = message.name;
			provider.sendMessage(new ai.CreateChatEvent(question.chat));
		}
		
		/* Send question */
		var send_question = async () => {
			await question.addUserMessage(message.content);
			await question.addAgentMessage();
			await settings.saveChat(question.chat);
			await question.updateRules();
			await question.send();
		};
		send_question();
		
		/* Returns result */
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
				var data = await fs.readFile(file_path, "utf8");
				result.push({
					path: file_path,
					content: data,
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
}


class BayLangViewProvider
{
	context = null;
	extensionUri = null;
	globalStorageUri = null;
	panel = null;
	registry = null;
	
	
	/**
	 * Constructor
	 */
	constructor(context)
	{
		this.context = context;
		this.registry = new CommandRegistry();
		this.extensionUri = context.extensionUri;
		this.globalStorageUri = context.globalStorageUri;
	}
	
	
	/**
	 * Returns webview id
	 */
	getId()
	{
		return "baylang-ai-view";
	}
	
	
	/**
	 * Resovle webview
	 */
	resolveWebviewView(panel, context, token)
	{
		this.panel = panel;
		panel.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this.extensionUri
			]
		};
		panel.webview.html = this.getWebviewContent(panel);
		panel.webview.onDidReceiveMessage(this.onMessage.bind(this));
		
		/* Create registry */
		this.registry.webview = panel.webview;
		
		/* Register commands */
		registerCommands(this);
	}
	
	
	/**
	 * Send message to view
	 */
	async sendMessage(message)
	{
		this.panel.webview.postMessage({
			"command": message.data.event,
			"payload": message.getData(),
		})
	}
	
	
	/**
	 * Message from view
	 */
	onMessage(message)
	{
		this.registry.handleMessage(message);
	}
	
	
	/**
	 * Returns webview HTML
	 */
	getWebviewContent(panel)
	{
		const getLink = (uri) =>
			panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, uri));
		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>BayLang AI</title>
			<link href="${getLink("dist/main.css")}" rel="stylesheet" />
		</head>
		<body>
			<div class="app"></div>
			<script src="${getLink("dist/vue.runtime.global.js")}"></script>
			<script src="${getLink("dist/main.js")}"></script>
			<script>
				startApp((app, layout) => {
					console.log("Mount app");
					app.mount(".app");
					layout.setImageUrl("${getLink("dist/images")}");
					window.app = app;
					window.layout = layout;
				});
			</script>
		</body>
		</html>
	  `;
	}
}

function deactivate()
{
}

module.exports = {
	activate,
	deactivate
};