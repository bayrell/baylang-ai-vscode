import { Tool } from "../Ai/Tool.js";

export class RandomTool extends Tool
{
	constructor()
	{
		super();
		this.setName("random");
		this.setDescription("Generate random number beetwen a and b");
		this.addProps("a", "integer", "First number", true);
		this.addProps("b", "integer", "Second number", true);
	}
	
	
	/**
	 * Execute function
	 */
	async execute(params)
	{
		return Math.round(Math.random() * (params.b - params.a) + params.a);
	}
}