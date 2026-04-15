import { Tool } from "../../Ai/Tool.js";

export class SaveTag extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("save_notebook_tag");
		this.setDescription("Save notebook tag");
		this.addProps({
			key: "name",
			type: "string",
			description: "Tag name",
			required: true,
		});
		this.addProps({
			key: "description",
			type: "string",
			description: "Tag description",
			required: false,
		});
		this.setPrompt(`To save notebook tag use \`save_note_tag\` tool.`);
		this.settings = settings;
	}
	
	/**
	 * Execute
	 */
	async execute(params, question)
	{
		if (params.name == undefined)
		{
			throw new Error("Tag name is required");
		}
		
		const service = question.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.note.tag", "save", {
				name: params.name,
				description: params.description || "",
			}
		)
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		return `Success saved tag '${params.name}'`;
	}
}
