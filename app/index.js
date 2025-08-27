const ai = require("./ai.js");
const fs = require("fs").promises;
const path = require("path");
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


class Settings
{
	constructor(globalStorageUri)
	{
		this.folderPath = globalStorageUri.path;
		this.filePath = path.join(this.folderPath, "settings.json");
		this.data = {};
	}
	
	
	/**
	 * Load data
	 */
	async loadData()
	{
		try {
			const raw = await fs.readFile(this.filePath, "utf-8");
			this.data = JSON.parse(raw);
		}
		catch (e)
		{
			this.data = {};
		}
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
	loadAgents()
	{
		return this.data.agents ? Object.values(this.data.agents) : [];
	}
	
	
	/**
	 * Get agent by ID
	 */
	getAgentById(id)
	{
		if (!this.data.agents) return null;
		if (!this.data.agents[id]) return null;
		return ai.createAgent(this.data.agents[id], this);
	}
	
	
	/**
	 * Save agent
	 */
	async saveAgent(item)
	{
		if (!this.data.agents) this.data.agents = {};
		this.data.agents[item.id] = item;
		await this.saveData();
	}
	
	
	/**
	 * Delete agent
	 */
	async deleteAgent(id)
	{
		if (this.data.agents && this.data.agents[id])
		{
			delete this.data.agents[id];
			await this.saveData();
		}
	}
	
	
	/**
	 * Load models
	 */
	loadModels()
	{
		return this.data.models ? Object.values(this.data.models) : []
	}
	
	
	/**
	 * Returns model by id
	 */
	getModelById(id)
	{
		if (!this.data.models) return null;
		if (!this.data.models[id]) return null;
		return ai.createModel(this.data.models[id]);
	}
	
	
	/**
	 * Save model
	 */
	async saveModel(item)
	{
		if (!this.data.models) this.data.models = {};
		this.data.models[item.id] = item;
		await this.saveData();
	}
	
	
	/**
	 * Delete model
	 */
	async deleteModel(id)
	{
		if (this.data.models && this.data.models[id])
		{
			delete this.data.models[id];
			await this.saveData();
		}
	}
	
	
	/**
	 * Load chat
	 */
	async loadChat()
	{
		var folderPath = path.join(this.folderPath, "chat");
		var files = [];
		try
		{
			files = await fs.readdir(folderPath);
		}
		catch (e){}
		
		files = files.filter(file => file.endsWith(".json"))
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
		var folderPath = path.join(this.folderPath, "chat");
		var filePath = path.join(folderPath, chat_id + ".json");
		try {
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
		var folderPath = path.join(this.folderPath, "chat");
		if (!await fileExists(folderPath))
		{
			await fs.mkdir(folderPath, { recursive: true });
		}
		
		var filePath = path.join(folderPath, chat.id + ".json");
		await fs.writeFile(filePath, JSON.stringify(chat.getData(), null, 2));
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
		var items = settings.loadAgents();
		return {
			success: true,
			items: items,
		};
	});
	
	/* Save agent */
	registry.register("save_agent", async (item) => {
		await settings.saveAgent(item);
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
	
	/* Load model */
	registry.register("load_models", async () => {
		var items = settings.loadModels();
		return {
			success: true,
			items: items,
		};
	});
	
	/* Save model */
	registry.register("save_model", async (item) => {
		await settings.saveModel(item);
		return {
			success: true,
		};
	});
	
	/* Delete model */
	registry.register("delete_model", async (id) => {
		await this.deleteModel(id);
		return {
			success: true,
		};
	});
	
	/* Send message */
	registry.register("send_message", async (message) => {
		
		/* Find agent by id */
		var agent = settings.getAgentById(message.agent);
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
		return {
			success: true,
			id: id,
			name: name,
		};
	});
	
	/* Delete chat */
	registry.register("delete_chat", async (id) => {
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