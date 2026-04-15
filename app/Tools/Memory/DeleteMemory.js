import { Tool } from "../../Ai/Tool.js";

export class DeleteMemory extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("delete_memory");
		this.setDescription("Delete agent memory");
		this.addProps({
			key: "name",
			type: "string",
			description: "Memory name (e.g., 'system_settings', 'user_data')",
			required: true,
		});
		this.setPrompt(`To delete agent memory use \`delete_memory\` tool.`);
		this.settings = settings;
	}
	
	
	/**
	 * Execute
	 */
	async execute(params, question)
	{
		if (params.name == undefined)
		{
			throw new Error("Memory name not found");
		}
		const name = params.name;
		const service = question.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.memory", "delete", {
				category: name,
			}
		)
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		return `Success deleted memory '${name}'`;
	}
}
