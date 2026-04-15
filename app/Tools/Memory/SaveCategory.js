import { Tool } from "../../Ai/Tool.js";

export class SaveCategory extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("save_notebook_category");
		this.setDescription("Save notebook category");
		this.addProps({
			key: "name",
			type: "string",
			description: "Category name",
			required: true,
		});
		this.addProps({
			key: "description",
			type: "string",
			description: "Category description",
			required: false,
		});
		this.setPrompt(`To save notebook category use \`save_note_category\` tool.`);
		this.settings = settings;
	}
	
	/**
	 * Execute
	 */
	async execute(params, question)
	{
		if (params.name == undefined)
		{
			throw new Error("Category name is required");
		}
		
		const service = question.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.note.category", "save", {
				name: params.name,
				description: params.description || "",
			}
		)
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		return `Success saved category '${params.name}'`;
	}
}
