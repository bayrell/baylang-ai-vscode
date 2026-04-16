import { Tool } from "../../Ai/Tool.js";
import { toDate } from "../../lib.js";

export class ReadNote extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("read_note");
		this.setDescription("Read note from notebook");
		this.addProps({
			key: "id",
			type: "array",
			items: { type: "number" },
			description: "Note ID",
			required: true,
		});
		this.setPrompt(`To read note use \`read_note\` tool.`);
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments
	 */
	getArgumentsText(params)
	{
		const id = JSON.stringify(params.id);
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
		
		let id = params.id;
		if (!Array.isArray(id)) id = [id];
		
		const service = this.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.note", "get", {
				ids: id
			}
		)
		if (response.code != 1)
		{
			throw new Error(response.message);
		}
		const items = response.data.items.map(
			(item) => {
				return {
					id: item.id,
					category: item.category,
					title: item.title,
					content: item.content,
					file_name: item.file_name,
					priority: item.priority,
					tags: item.tags || [],
					gmtime_add: toDate(item.gmtime_add),
					gmtime_edit: toDate(item.gmtime_edit),
				};
			}
		)
		return items;
	}
}
