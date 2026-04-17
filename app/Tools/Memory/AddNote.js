import { Tool } from "../../Ai/Tool.js";

export class AddNote extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("add_note");
		this.setDescription("Add new note to notebook");
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
			key: "category",
			type: "string",
			description: "Note category (e.g., 'public_wiki', 'user_data')",
			required: true,
		});
		this.addProps({
			key: "tags",
			type: "array",
			items: { type: "string" },
			description: "Note tags",
			required: false,
		});
		this.addProps({
			key: "priority",
			type: "string",
			description: "Note priority (e.g., 'high', 'medium', 'low', 'critical')",
			required: false,
		});
		this.setPrompt(`To add new note use \`add_note\` tool.`);
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments
	 */
	getArgumentsText(params)
	{
		const category = params.category || "";
		const title = params.title || "";
		return `(${category}, ${title})`;
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
		if (params.category == undefined)
		{
			throw new Error("Category is required");
		}
		if (params.title == undefined)
		{
			throw new Error("Title is required");
		}
		if (params.content == undefined)
		{
			throw new Error("Content is required");
		}
		
		const service = this.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.note", "add", {
				title: params.title,
				content: params.content,
				category: params.category,
				tags: params.tags || [],
				priority: params.priority || "medium",
			}
		)
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		return `Success added note with ID: ${response.data.item.id}`;
	}
}
