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
		this.memory = "";
		this.memory_token = "";
		this.prompt = "";
		this.rules = [];
		this.providers = "";
		this.secure = false;
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
		if (data.memory) this.memory = data.memory;
		if (data.memory_token) this.memory_token = data.memory_token;
		if (data.prompt) this.prompt = data.prompt;
		if (data.providers != undefined) this.providers = data.providers;
		if (data.secure != undefined) this.secure = data.secure;
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
			memory: this.memory,
			memory_token: this.memory_token,
			prompt: this.prompt,
			rules: this.rules,
			providers: this.providers,
			secure: this.secure,
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