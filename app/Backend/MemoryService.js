import { removeLastSlash, getErrorResponse } from "../lib.js";

export class MemoryService
{
	constructor(settings)
	{
		this.settings = settings;
	}
	
	
	/**
	 * Find memory by name
	 */
	findByName(name)
	{
		const items = this.settings.loadMemory();
		return items.find((item) => item.name == name);
	}
	
	
	/**
	 * Send api
	 */
	async sendApi(agent, api_name, method_name, body)
	{
		const name = agent.memory;
		const memory = this.findByName(name);
		if (!memory)
		{
			return null;
		}
		
		if (body == undefined) body = {};
		
		const url = removeLastSlash(memory.url) + "/api/" +
			api_name + "/" + method_name;
		const headers = {
			"Authorization": "Bearer " + agent.memory_token,
			"Content-Type": "application/json",
		};
		const response = await fetch(url, {
			method: "POST",
			headers: headers,
			body: JSON.stringify(body),
		});
		
		if (!response.ok)
		{
			const result = await getErrorResponse(response);
			console.log(result);
			return null;
		}
		
		const data = await response.json();
		return data;
	}
	
	
	/**
	 * Discovery
	 */
	async discovery(agent)
	{
		return await this.sendApi(
			agent, "ai.discovery", "data"
		);
	}
}