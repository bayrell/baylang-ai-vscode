import { Tool } from "../Ai/Tool";

export class MCPServerTool extends Tool
{
	constructor(tool, server)
	{
		super();
		
		this.tool = tool;
		this.server = server;
		
		/* Add props */
		this.setName(server.getToolName(tool.name));
		this.setDescription(tool.description);
		
		if (tool.inputSchema)
		{
			const required = tool.inputSchema.required;
			for (const name in tool.inputSchema.properties)
			{
				const props = tool.inputSchema.properties[name];
				this.addProps({
					key: name,
					type: props.type,
					description: props.title,
					required: required.indexOf(name) >= 0,
				})
			}
		}
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
			return await this.server.execute(this.tool.name, params);
		}
		catch (e)
		{
			throw new Error(e.message);
		}
	}
}