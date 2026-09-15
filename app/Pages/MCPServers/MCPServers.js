import Crud from "../../Components/Crud.js";
import Form from "../../Components/Form/Form.js";

export default class MCPServers
{
	constructor(layout)
	{
		this.layout = layout;
		this.items = [];
		this.crud = new Crud();
		this.form = new Form();
		this.form.setDefault({
			"name": "",
			"type": "",
			"url": "",
			"command": "",
			"args": [],
			"prefix": "",
			"enabled": true,
			"env": [],
			"tools": [],
		});
	}
	
	
	/**
	 * Find item by pk
	 */
	findItemByPk(pk)
	{
		return this.items.find(item => item.id == pk);
	}
	
	
	/**
	 * Returns primary key
	 */
	getPrimaryKey(item)
	{
		return item.id;
	}
	
	
	/**
	 * Open page
	 */
	async open()
	{
		this.crud.showList();
		await this.load();
	}
	
	
	/**
	 * Load page
	 */
	async load()
	{
		var result = this.layout.api.call("load_mcp");
		if (!result.isSuccess()) return;
		
		this.items = [];
		for (const item of result.response.items)
		{
			this.items.push(item);
		}
	}
	
	
	/**
	 * Add item
	 */
	async add()
	{
		const item = this.form.item;
		const result = await this.layout.api.call("add_mcp",
			{ item: item }
		);
		return result;
	}
	
	
	/**
	 * Save item
	 */
	async save()
	{
		const pk = this.form.pk;
		const item = this.form.item;
		const result = await this.layout.api.call("save_mcp",
			{ id: pk, item: item }
		)
		return result;
	}
	
	
	/**
	 * Delete item
	 */
	async delete()
	{
		const pk = this.form.pk;
		const result = await this.layout.api.call("delete_mcp",
			{ id: pk }
		);
		return result;
	}
}