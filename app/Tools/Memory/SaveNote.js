import { Tool } from "../../Ai/Tool.js";

export class SaveNote extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("save_note");
		this.setDescription("Save note in notebook with ID");
		this.addProps({
			key: "id",
			type: "number",
			description: "Note ID",
			required: true,
		});
		this.addProps({
			key: "title",
			type: "string",
			description: "Note title",
			required: true,
		});
		this.addProps({
			key: "content",
			type: "string",
			description: "Note content",
			required: true,
		});
		this.addProps({
			key: "file_name",
			type: "string",
			description: "Note file name (optional)",
			required: false,
		});
		this.addProps({
			key: "priority",
			type: "string",
			description: "Note priority (e.g., 'high', 'medium', 'low', 'critical')",
			required: false,
		});
		this.addProps({
			key: "tags",
			type: "array",
			items: { type: "string" },
			description: "Note tags",
			required: false,
		});
		this.setPrompt(`To save note use \`save_note\` tool.`);
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments
	 */
	getArgumentsText(params)
	{
		const category = params.category;
		const title = params.title;
		return `(${category}, ${title})`;
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
		if (params.title == undefined)
		{
			throw new Error("Title is required");
		}
		if (params.content == undefined)
		{
			throw new Error("Content is required");
		}
		
		const service = question.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.note", "save", {
				id: params.id,
				title: params.title,
				content: params.content,
				file_name: params.file_name,
				priority: params.priority || "medium",
				tags: params.tags || [],
			}
		)
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		return `Success saved note with ID: ${response.data.item.id}`;
	}
}
