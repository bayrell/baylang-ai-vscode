import { Tool } from "../../Ai/Tool.js";

export class UpdateMemory extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("update_memory");
		this.setDescription("Update agent memory");
		this.addProps({
			key: "name",
			type: "string",
			description: "Memory name (e.g., 'system_settings', 'user_data')",
			required: true,
		});
		this.addProps({
			key: "content",
			type: "string",
			description: "Memory content",
			required: true,
		});
		this.addProps({
			key: "command",
			type: "string",
			description: "Available `append` or `save`",
			required: true,
		})
		this.setPrompt(`To update agent memory use \`update_memory\` tool. Command \`append\` add new information, \`save\` rewrite all memory by name`);
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments
	 */
	getArgumentsText(params)
	{
		const name = params.name;
		const command = params.command;
		return `(${name}, ${command})`;
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
		const content = params.content || "";
		const command = params.command == "append" ? "add" : "save";
		const service = question.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.memory", command, {
				category: name,
				content: content,
			}
		)
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		return `Success updated memory '${name}'`;
	}
}
