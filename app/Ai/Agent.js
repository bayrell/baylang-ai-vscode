export class Agent
{
	constructor()
	{
		this.name = "";
		this.global = true;
		this.enable_rules = "1";
		this.default = {
			model: "",
			model_name: "",
		};
		this.model = null;
		this.model_name = "";
		this.prompt = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		if (data.name) this.name = data.name;
		if (data.global != undefined) this.global = data.global;
		if (data.enable_rules) this.enable_rules = data.enable_rules;
		if (data.default) this.default = data.default;
		if (data.model) this.model = data.model;
		if (data.model_name) this.model_name = data.model_name;
		if (data.prompt) this.prompt = data.prompt;
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
			default: this.default,
			model: this.model,
			model_name: this.model_name,
			prompt: this.prompt,
		};
	}
	
	
	/**
	 * Enable rules
	 */
	enableRules()
	{
		return this.enable_rules == "1";
	}
}

export function createAgent(data, settings)
{
	var agent = new Agent();
	agent.assign(data);
	agent.model = settings.getModelByName(data.model);
	return agent;
};