import { Tool } from "../../Ai/Tool.js";

export class ReadMemory extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("read_memory");
		this.setDescription("Read agent memory");
		this.addProps({
			key: "name",
			type: "string",
			description: "Memory name (e.g., 'system_settings', 'user_data')",
			required: true
		});
		this.setPrompt(`To read agent memory use \`read_memory\` tool.`);
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments
	 */
	getArgumentsText(params)
	{
		const name = params.name;
		return `(${name})`;
	}
	
	
	/**
	 * Execute
	 */
	async execute(params, question)
	{
		if (params.name == undefined)
		{
			throw new Error("Name does not exists");
		}
		const service = question.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.memory", "read", {
				"category": params.name
			}
		);
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		return response.data.content;
	}
}
