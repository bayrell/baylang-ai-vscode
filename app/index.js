const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

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
		
		/* Create folder if does not exists */
		if (!fs.existsSync(this.folderPath))
		{
			fs.mkdirSync(this.folderPath, { recursive: true });
		}
	}
	
	
	/**
	 * Load data
	 */
	async loadData()
	{
        try {
            const raw = await fs.promises.readFile(this.filePath, "utf-8");
            return JSON.parse(raw);
        }
		catch (e)
		{
            return {};
        }
    }
	
	
	/**
	 * Save data
	 */
	async saveData(data)
	{
        await fs.promises.writeFile(this.filePath, JSON.stringify(data, null, 2));
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
function registerCommands(provider)
{
	var registry = provider.registry;
	var settings = new Settings(provider.globalStorageUri);
	
	/* Load chat */
	registry.register("load_chat", async () => {
		var data = await settings.loadData();
		return {
			"success": false,
			"chat": data.chat ? data.chat : [],
		};
	});
	
	/* Load agent */
	registry.register("load_agents", async () => {
		var data = await settings.loadData();
		return {
			success: true,
			items: data.agents ? Object.values(data.agents) : [],
		};
	});
	
	/* Save agent */
	registry.register("save_agent", async (item) => {
		var data = await settings.loadData();
		if (!data.agents) data.agents = {};
		data.agents[item.id] = item;
		await settings.saveData(data);
		return {
			success: true,
		};
	});
	
	/* Delete agent */
	registry.register("delete_agent", async (id) => {
		var data = await settings.loadData();
		if (data.agents && data.agents[id])
		{
			delete data.agents[id];
			await settings.saveData(data);
		}
		return {
			success: true,
		};
	});
	
	/* Load model */
	registry.register("load_models", async () => {
		var data = await settings.loadData();
		return {
			success: true,
			items: data.models ? Object.values(data.models) : [],
		};
	});
	
	/* Save agent */
	registry.register("save_model", async (item) => {
		var data = await settings.loadData();
		if (!data.models) data.models = {};
		data.models[item.id] = item;
		await settings.saveData(data);
		return {
			success: true,
		};
	});
	
	/* Delete agent */
	registry.register("delete_model", async (id) => {
		var data = await settings.loadData();
		if (data.models && data.models[id])
		{
			delete data.models[id];
			await settings.saveData(data);
		}
		return {
			success: true,
		};
	});
	
	/* Send message */
	registry.register("send_message", async (message) => {
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
				var data = await fs.promises.readFile(file_path, "utf8");
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
		return result;
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
	 * Message from api
	 */
	async onApiMessage(data)
	{
		this.panel.webview.postMessage({
			"command": data.event,
			"payload": data,
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