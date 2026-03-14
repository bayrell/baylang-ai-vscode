import { Tool } from "../Ai/Tool.js";

export class GetCurrentDate extends Tool
{
	constructor()
	{
		super();
		this.setName("get_current_date");
		this.setDescription("Get the current date and time");
		this.setPrompt("To get the current date and time, use the `get_current_date` function. Use the `only_time` parameter to get only the time.");

		// Define the 'only_time' parameter for the tool
		this.addProps({
			key: "only_time",
			type: "boolean",
			description: "If true, returns only the time instead of the full date and time",
			required: false
		});
	}
	
	
	/**
	 * Execute function
	 * @param {object} params - Optional parameters
	 * @param {boolean} params.only_time - If true, returns only time instead of full date and time
	 */
	async execute(params)
	{
		const current_date = new Date();
		
		// Check if only_time parameter is provided and true
		if (params && params.only_time) {
			return current_date.toLocaleTimeString();
		}
		
		return current_date.toString();
	}
}