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
			type: "array",
			items: { type: "string" },
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
		const category = params.category || "";
		const query = params.query || "";
		const tags = JSON.stringify(params.tags || []);
		return `(${category}, ${query}, ${tags})`;
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
		
		let query = params.query;
		if (!Array.isArray(query)) query = [query];
		
		const items = [];
		const addItem = (item) => {
			const index = items.findIndex((e) => e.id == item.id);
			if (index >= 0) return;
			items.push(item);
		};
		
		const service = this.settings.memory;
		for (let i=0; i<query.length; i++)
		{
			const response = await service.sendApi(
				question.agent, "ai.note", "search", {
					category: params.category || "",
					query: query[i],
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
			for (let j=0; j<response.data.items.length; j++)
			{
				const item = response.data.items[j];
				addItem({
					id: item.id,
					category: item.category,
					title: item.title,
					file_name: item.file_name,
					priority: item.priority,
					tags: item.tags || [],
					distance: item.distance || 0,
					gmtime_add: toDate(item.gmtime_add),
					gmtime_edit: toDate(item.gmtime_edit),
				});
			}
		}
		return items;
	}
}
