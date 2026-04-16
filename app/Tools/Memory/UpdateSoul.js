import { Tool } from "../../Ai/Tool.js";

export class UpdateSoul extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("update_soul");
		this.setDescription("Update agent soul memory");
		this.addProps({
			key: "content",
			type: "string",
			description: "Memory content",
			required: true,
		});
		this.setPrompt(`To update agent soul use \`update_soul\` tool.`);
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments
	 */
	getArgumentsText(params)
	{
		return "()";
	}
	
	
	/**
	 * Can use
	 */
	canUse(question)
	{
		return this.settings.memory.canUse(question.agent);
	}
	
	
	/**
	 * Execute
	 */
	async execute(params, question)
	{
		const content = params.content || "";
		const service = this.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.soul", "update", {
				content: content,
			}
		)
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		return `Success updated memory`;
	}
}
