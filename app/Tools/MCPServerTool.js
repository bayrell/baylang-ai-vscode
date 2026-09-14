import { Tool } from "../Ai/Tool.js";

export class MCPServerTool extends Tool
{
	constructor(server, toolDef)
	{
		super();

		// Tool name: prefix + "_" + original_name
		var fullName = server.prefix
			? server.prefix + "_" + toolDef.name
			: toolDef.name;

		this.setName(fullName);
		this.setDescription(toolDef.description || "");
		this.setPrompt(
			"Use the `" + fullName + "` tool from MCP server '" + server.name + "'. " +
			(toolDef.description || "")
		);

		this.server = server;
		this.toolDef = toolDef;
		this.inputSchema = toolDef.inputSchema || { type: "object", properties: {} };

		// Register properties from inputSchema
		if (this.inputSchema.properties)
		{
			var required = this.inputSchema.required || [];
			for (var key in this.inputSchema.properties)
			{
				var prop = this.inputSchema.properties[key];
				this.addProps({
					key: key,
					type: prop.type || "string",
					description: prop.description || "",
					required: required.includes(key),
				});
			}
		}
	}


	/**
	 * Execute tool via MCP server
	 */
	async execute(params, question)
	{
		var result = await this.server.callTool(
			this.toolDef.name,
			params
		);

		// Extract text from MCP response
		if (result && result.content)
		{
			var texts = [];
			for (var i = 0; i < result.content.length; i++)
			{
				var block = result.content[i];
				if (block.type == "text")
				{
					texts.push(block.text);
				}
			}
			return texts.join("\n");
		}

		return JSON.stringify(result);
	}
}