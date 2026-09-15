import { Tool } from "../Ai/Tool";

export class MCPServerTool extends Tool
{
	constructor(tool, server)
	{
		super();
		this.tool = tool;
		this.server = server;
		this.setName(server.getToolName(tool.name));
	}
	
	
	/**
	 * Get text
	 */
	getArgumentsText(params)
	{
		const args = [];
		for (const key in params)
		{
			const value = params[key];
			if (value.length > 100) args.push(value.substring(0, 100));
			else args.push(value);
		}
		return "(" + args.join(", ") + ")";
	}
	
	
	/**
	 * Execute tool
	 */
	async execute(params, question)
	{
		try
		{
			return this.server.send(this.tool.name, params);
		}
		catch (e)
		{
			throw new Error(e.message);
		}
	}
}