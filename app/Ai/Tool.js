export class Tool
{
	constructor()
	{
		this.f = null;
		this.name = "";
		this.props = {};
		this.description = "";
		this.prompt = "";
	}
	
	
	/**
	 * Execute tools with params
	 */
	async execute(params)
	{
		var res = this.f(params);
		if (res instanceof Promise)
		{
			res = await res;
		}
		return res;
	}
	
	
	/**
	 * Add props
	 */
	addProps(params)
	{
		this.props[params.key] = params;
		return this;
	}
	
	
	/**
	 * Set name
	 */
	setName(value)
	{
		this.name = value;
		return this;
	}
	
	
	/**
	 * Set description
	 */
	setDescription(value)
	{
		this.description = value;
		return this;
	}
	
	
	/**
	 * Set tool function
	 */
	setFunction(value)
	{
		this.f = value;
		return this;
	}
	
	
	/**
	 * Set prompt
	 */
	setPrompt(value)
	{
		this.prompt = value;
		return this;
	}
	
	
	/**
	 * Returns arguments text
	 */
	getArgumentsText(args)
	{
		return "";
	}
	
	
	/**
	 * Returns props data
	 */
	getProps()
	{
		var result = {};
		var required = [];
		for (var key in this.props)
		{
			var item = Object.assign({}, this.props[key]);
			var is_required = item.required ? item.required : false;
			if (typeof item.required != "undefined") delete item.required;
			if (typeof item.key != "undefined") delete item.key;
			result[key] = item;
			if (is_required) required.push(key);
		}
		return [result, required];
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		var [result, required] = this.getProps();
		return {
			type: "function",
			function:
			{
				name: this.name,
				description: this.description,
				parameters: {
					type: "object",
					properties: result,
					required: required,
				}
			}
		};
	}
}


export class Tools
{
	constructor()
	{
		this.items = [];
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return this.items.map((item) => item.getData());
	}
	
	
	/**
	 * Add tool
	 */
	add(tool)
	{
		this.items.push(tool);
	}
	
	
	/**
	 * Returns tool by index
	 */
	get(index)
	{
		return this.items[index];
	}
	
	
	/**
	 * Returns tools count
	 */
	count()
	{
		return this.items.length;
	}
	
	
	/**
	 * Find tool by name
	 */
	findTool(name)
	{
		return this.items.find(
			(item) => item.name == name
		);
	}
	
	
	/**
	 * Execute tool
	 */
	async execute(tool)
	{
		var name = tool.function.name;
		var args = tool.function.arguments;
		
		/* Find tool */
		var find = this.findTool(name);
		if (!find)
		{
			throw new Error("Tool '" + name + "' not found")
		}
		
		/* Parse arguments */
		try
		{
			args = JSON.parse(args);
		}
		catch (e)
		{
			throw new Error("Tool '" + name + "' parse failed;")
		}
		
		return await tool.execute(args);
	}
}