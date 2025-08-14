const fs = require("fs");
const vscode = require("vscode");
const WebSocket = require("ws");
const extension = vscode.extensions.getExtension("BAYRELL.baylang-ai");

function activate(context)
{
	/* Create socket */
	var api = new ApiProvider("http://app_baylang_ai");
	api.connect();
	
	/* Register provider */
	var provider = new BayLangViewProvider(context, api);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(provider.getId(), provider, {
			webviewOptions: {
				retainContextWhenHidden: true,
			}
		})
	);
}


/**
 * Build URLSearchParams key
 */
function buildURLSearchParamsKey(path)
{
	if (path.length == 0) return "";
	if (path.length == 1) return path[0];
	var name = path[0];
	path = path.slice(1);
	return name + "[" + path.join("][") + "]";
}


/**
 * Update URLSearchParams
 */
function updateURLSearchParams(post, path, params)
{
	if (Array.isArray(post))
	{
		for (var i=0; i<post.length; i++)
		{
			updateURLSearchParams(post[i], path.concat(i), params);
		}
	}
	else if (typeof post == "object" && !(post instanceof File))
	{
		for (var key in post)
		{
			updateURLSearchParams(post[key], path.concat(key), params);
		}
	}
	else
	{
		var key = buildURLSearchParamsKey(path);
		params.append(key, post);
	}
}


/**
 * Returns URLSearchParams
 */
function getURLSearchParams(post)
{
	var params = new URLSearchParams();
	updateURLSearchParams(post, [], params);
	return params;
}


class ApiProvider
{
	constructor(url)
	{
		this.url = url;
		this.listeners = [];
		this.ws = null;
	}
	
	
	/**
	 * Returns domain
	 */
	getWebSocket()
	{
		var url = new URL(this.url);
		if (url.protocol == "https") return "wss://" + url.host;
		return "ws://" + url.host;
	}
	
	
	/**
	 * Connect
	 */
	connect()
	{
		this.ws = new WebSocket(this.getWebSocket() + "/api/chat/socket");
		this.ws.binaryType = 'arraybuffer';
		this.ws.onopen = this.onConnect.bind(this);
		this.ws.onmessage = this.onMessage.bind(this);
		this.ws.onclose = this.onDisconnect.bind(this);
		this.ws.onerror = this.onError.bind(this);
	}
	
	
	/**
	 * Add listener
	 */
	addListener(listener)
	{
		this.listeners.push(listener);
	}
	
	
	/**
	 * On connect
	 */
	onConnect()
	{
		console.log("Connected to websocket");
	}
	
	
	/**
	 * On disconnect
	 */
	onDisconnect()
	{
	}
	
	
	/**
	 * On message
	 */
	onMessage(message)
	{
		/* JSON decode */
		var item = null;
		try
		{
			item = JSON.parse(message.data);
		}
		catch(e)
		{
		}
		
		/* Check message */
		if (item == null) return;
		
		/* Receive message */
		for (var i=0; i<this.listeners.length; i++)
		{
			var listener = this.listeners[i];
			listener(item);
		}
	}
	
	
	/**
	 * On error
	 */
	onError()
	{
	}
	
	
	/**
	 * Send api
	 */
	async sendApi(url, post = {})
	{
		try
		{
			var response = await fetch(
				this.url + url,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: getURLSearchParams(post),
				}
			);
			return await response.json();
		}
		catch (e)
		{
			return {
				code: -1,
				message: e.message,
			};
		}
	}
	
	
	/**
	 * Load chats
	 */
	async load()
	{
		return await this.sendApi("/api/chat/load");
	}
	
	
	/**
	 * Load agents
	 */
	async loadAgents()
	{
		return await this.sendApi("/api/settings/agent");
	}
	
	
	/**
	 * Delete chat
	 */
	async deleteChat(chat_id)
	{
		return await this.sendApi("/api/chat/delete", {
			"chat_id": chat_id,
		});
	}
	
	
	/**
	 * Rename chat
	 */
	async renameChat(chat_id, title)
	{
		return await this.sendApi("/api/chat/delete", {
			"chat_id": chat_id,
			"title": title,
		});
	}
	
	
	/**
	 * Update chat files
	 */
	async updateChatFiles(data)
	{
		return await this.sendApi("/api/chat/delete", data);
	}
	
	
	/**
	 * Send message
	 */
	async sendMessage(data)
	{
		return await this.sendApi("/api/chat/send", data);
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

class BayLangViewProvider
{
	api = null;
	panel = null;
	extensionUri = null;
	
	
	/**
	 * Constructor
	 */
	constructor(context, api)
	{
		this.api = api;
		this.registry = new CommandRegistry();
		this.extensionUri = context.extensionUri;
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
		
		/* Add listener */
		this.api.addListener(this.onApiMessage.bind(this));
		
		/* Create registry */
		this.registry.webview = panel.webview;
		
		/* Load */
		this.registry.register("load", async () => {
			const [load_result, load_agents_result] = await Promise.all([
				this.api.load(),
				this.api.loadAgents(),
			]);
			return {
				"chat": load_result,
				"agents": load_agents_result,
			};
		});
		
		/* Send message */
		this.registry.register("send_message", async (message) => {
			await this.api.sendMessage(message);
		});
		
		/* Rename chat */
		this.registry.register("rename_chat", async (message) => {
			var chat_id = message.chat_id;
			var name = message.name;
			var result = await this.api.renameChat(chat_id, name);
			return {
				success: result.code > 0,
				chat_id: chat_id,
				name: name,
			};
		});
		
		/* Delete chat */
		this.registry.register("delete_chat", async (message) => {
			var chat_id = message.chat_id;
			var result = await this.api.deleteChat(chat_id);
			return {
				success: result.code > 0,
				chat_id: chat_id,
			}
		});
		
		/* Update chat files */
		this.registry.register("update_chat_files", async (message) => {
			await this.api.updateChatFiles(message);
		});
		
		/* Read files */
		this.registry.register("read_files", async (files) => {
			var result = [];
			for (var i=0; i<files.length; i++)
			{
				var file_path = files[i];
				try
				{
					var data = await fs.promises.readFile(file_path, "utf8");
					result.push({
						path: file_path,
						content: Buffer.from(data),
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
			<style>
			body *{ box-sizing: border-box; }
			:root{
				--border-color: #e0e1e6;
				--hover-color: #eee;
				--primary-color: #0077ee;
				--secondary-color: #5c6370;
				--danger-color: #e00000;
				--success-color: #98c379;
				--gray-color: #6b7280;
			}
			</style>
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