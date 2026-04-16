import { Tool } from "../../Ai/Tool.js";
import { toDate } from "../../lib.js";

export class SearchNote extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("search_note");
		this.setDescription("Search note in notebook");
		this.addProps({
			key: "category",
			type: "string",
			description: "Note category",
			required: false,
		});
		this.addProps({
			key: "query",
			type: "string",
			description: "Query string (semantic search with cosine distance)",
			required: false,
		});
		this.addProps({
			key: "tags",
			type: "array",
			items: { type: "string" },
			description: "Tags",
			required: false,
		});
		this.addProps({
			key: "limit",
			type: "number",
			description: "Limit items on page",
			required: false,
		});
		this.addProps({
			key: "page",
			type: "number",
			description: "Current page. Default 1",
			required: false,
		})
		this.setPrompt(`To search note use \`search_note\` tool.`);
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments
	 */
	getArgumentsText(params)
	{
		const category = params.category;
		const query = params.query;
		const tags = JSON.stringify(params.tags || []);
		const page = params.page || 1;
		return `(${category}, ${query}, ${tags}, ${page})`;
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
		if (!params) params = {};
		
		const service = this.settings.memory;
		const response = await service.sendApi(
			question.agent, "ai.note", "search", {
				category: params.category || "",
				query: params.query || "",
				tags: params.tags || [],
				limit: params.limit || 20,
				page: params.page - 1 || 0,
				content: false,
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
					file_name: item.file_name,
					priority: item.priority,
					tags: item.tags || [],
					distance: item.distance || 0,
					gmtime_add: toDate(item.gmtime_add),
					gmtime_edit: toDate(item.gmtime_edit),
				};
			}
		)
		return items;
	}
}
