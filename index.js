const vscode = require("vscode");
const extension = vscode.extensions.getExtension("BAYRELL.baylang-ai");

function activate(context)
{
	/* Create socket */
	var api = new ApiProvider("http://app_baylang_ai");
	//api.connect();
	
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
		this.ws = new WebSocket(this.getWebSocket() + "/api/chat/app.chat/socket");
		this.ws.binaryType = 'arraybuffer';
		this.ws.onopen = this.onConnect;
		this.ws.onmessage = this.onMessage;
		this.ws.onclose = this.onDisconnect;
		this.ws.onerror = this.onError;
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
		for (var i=0; i<this.listeners.length; i++)
		{
			var listener = this.listeners[i];
			listener(message);
		}
	}
	
	
	/**
	 * On error
	 */
	onError()
	{
	}
	
	
	/**
	 * Load chats
	 */
	async load()
	{
		try
		{
			var response = await fetch(
				this.url + "/api/chat/app.chat/load",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
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
	 * Delete chat
	 */
	async deleteChat(chat_id)
	{
		try
		{
			var response = await fetch(
				this.url + "/api/chat/app.chat/delete",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						"data[chat_id]": chat_id,
					}),
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
	 * Rename chat
	 */
	async renameChat(chat_id, title)
	{
		try
		{
			var response = await fetch(
				this.url + "/api/chat/app.chat/rename",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						"data[chat_id]": chat_id,
						"data[title]": title,
					}),
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
	 * Send message
	 */
	async sendMessage(chat_id, message)
	{
		await fetch(
			this.url + "/api/chat/app.chat/send",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					chat_id: chat_id,
					text: message,
				}),
			}
		);
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
	}
	
	
	/**
	 * Message from api
	 */
	async onApiMessage(message)
	{
		console.log(message);
	}
	
	
	/**
	 * Message from view
	 */
	async onMessage(message)
	{
		if (message.command == "load")
		{
			var result = await this.api.load();
			this.panel.webview.postMessage({
				"command": "load",
				"payload": result,
			})
		}
		else if (message.command == "delete_chat")
		{
			var chat_id = message.payload.chat_id;
			var result = await this.api.deleteChat(chat_id, name);
			if (result.code == 1)
			{
				this.panel.webview.postMessage({
					"command": "delete_chat",
					"payload": {
						chat_id: chat_id,
					},
				});
			}
		}
		else if (message.command == "rename_chat")
		{
			var chat_id = message.payload.chat_id;
			var name = message.payload.name;
			var result = await this.api.renameChat(chat_id, name);
			if (result.code == 1)
			{
				this.panel.webview.postMessage({
					"command": "rename_chat",
					"payload": {
						chat_id: chat_id,
						name: name,
					},
				});
			}
		}
		else if (message.command == "send_message")
		{
			var chat_id = message.payload.chat_id;
			var message = message.payload.message;
		}
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