export class Usage
{
	constructor(layout)
	{
		this.total = {};
		this.items = {};
		this.layout = layout;
	}
	
	
	/**
	 * Load items
	 */
	async load()
	{
		var result = await this.layout.api.call("load_usage");
		if (!result.isSuccess()) return;
		
		/* Get result */
		if (result.response.total) this.total = result.response.total;
		if (result.response.items) this.items = result.response.items;
	}
	
	
	/**
	 * Open page
	 */
	async open()
	{
		await this.load();
	}
}