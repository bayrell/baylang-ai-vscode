export class Agent
{
	constructor()
	{
		this.name = "";
		this.file_name = "";
		this.global = true;
		this.enable_rules = "0";
		this.enable_tools = "0";
		this.model = "";
		this.model_name = "";
		this.prompt = "";
		this.rules = [];
	}
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		if (data.name) this.name = data.name;
		if (data.global != undefined) this.global = data.global;
		if (data.enable_rules) this.enable_rules = data.enable_rules;
		if (data.enable_tools) this.enable_tools = data.enable_tools;
		if (data.default) this.default = data.default;
		if (data.model) this.model = data.model;
		if (data.model_name) this.model_name = data.model_name;
		if (data.prompt) this.prompt = data.prompt;
		if (data.rules)
		{
			this.rules = data.rules;
			this.rules.sort();
		}
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return {
			name: this.name,
			global: this.global,
			enable_rules: this.enable_rules,
			enable_tools: this.enable_tools,
			default: this.default,
			model: this.model,
			model_name: this.model_name,
			prompt: this.prompt,
			rules: this.rules,
		};
	}
	
	
	/**
	 * Returns true if enable rules
	 */
	enableRules()
	{
		return this.enable_rules == "1";
	}
	
	
	/**
	 * Returns true if enable tools
	 */
	enableTools()
	{
		return this.enable_tools == "1";
	}
	
	
	/**
	 * Set file name
	 */
	setFileName(value)
	{
		this.file_name = value;
	}
}

export function createAgent(data, settings)
{
	var agent = new Agent();
	agent.assign(data);
	agent.model = settings.getModelByName(data.model);
	return agent;
};