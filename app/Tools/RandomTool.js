import { Tool } from "../Ai/Tool.js";

export class RandomTool extends Tool
{
	constructor()
	{
		super();
		this.setName("random");
		this.setDescription("Generate random number beetwen a and b");
		this.addProps({
			key: "a",
			type: "integer",
			description: "First number",
			required: true
		})
		this.addProps({
			key: "b",
			type: "integer",
			description: "Second number",
			required: true,
		})
	}
	
	
	/**
	 * Execute function
	 */
	async execute(params)
	{
		return Math.round(Math.random() * (params.b - params.a) + params.a);
	}
}