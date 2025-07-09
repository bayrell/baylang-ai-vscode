const vscode = require("vscode");
const extension = vscode.extensions.getExtension("BAYRELL.baylang-ai");

function activate(context)
{
	console.log("Activate");
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
		console.log("Resolve webview");
		this.panel = panel;
		panel.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this.extensionUri
			]
		};
		panel.webview.html = this.getWebviewContent();
	}
	
	getWebviewContent()
	{
		return `
		<!DOCTYPE html>
		<html lang="ru">
		<head>
			<meta charset="UTF-8">
			<title>BayLang AI</title>
		</head>
		<body>
			<h1>BayLang</h1>
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