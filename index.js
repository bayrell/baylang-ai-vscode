const vscode = require("vscode");
const extension = vscode.extensions.getExtension("BAYRELL.baylang-ai");

function activate(context)
{
	var provider = new BayLangViewProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(provider.getId(), provider)
	);
}

class BayLangViewProvider
{
	panel = null;
	extensionUri = null;
	
	constructor(context)
	{
		this.extensionUri = context.extensionUri;
	}
	
	getId()
	{
		return "baylang-ai-view";
	}
	
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
	}
	
	getWebviewContent(panel)
	{
		const getLink = (uri) =>
			panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, uri));
		return `
		<!DOCTYPE html>
		<html lang="ru">
		<head>
			<meta charset="UTF-8">
			<title>BayLang AI</title>
			<link href="${getLink("dist/main.css")}" rel="stylesheet" />
			<style>
			body *{ box-sizing: border-box; }
			:root{
				--border-color: #e0e1e6;
			}
			</style>
		</head>
		<body>
			<div class="app"></div>
			<script src="${getLink("dist/vue.runtime.global.prod.js")}"></script>
			<script src="${getLink("dist/main.js")}"></script>
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