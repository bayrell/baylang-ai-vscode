import { Tool } from "../../Ai/Tool.js";

export class DeleteNote extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("delete_note");
		this.setDescription("Delete note from notebook by ID");
		this.addProps({
			key: "id",
			type: "number",
			description: "Note ID to delete",
			required: true,
		});
		this.setPrompt(`To delete note use \`delete_note\` tool.`);
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments
	 */
	getArgumentsText(params)
	{
		const id = params.id;
		return `(${id})`;
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
		if (params.id == undefined)
		{
			throw new Error("ID is required");
		}
		
		const service = this.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.note", "delete", {
				id: params.id,
			}
		)
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		return `Success deleted note with ID: ${params.id}`;
	}
}
