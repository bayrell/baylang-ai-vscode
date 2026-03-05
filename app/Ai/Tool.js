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
	addProps(key, type, description, required)
	{
		this.props[key] = {
			type: type,
			description: description,
			required: required ? true : false,
		};
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
		this.value = value;
		return this;
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
			var item = this.props[key];
			result[key] = {
				type: item.type,
				description: item.description,
			};
			if (item.required) required.push(key);
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