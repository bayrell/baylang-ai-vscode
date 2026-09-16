import Crud from "../../Components/Crud.js";
import Form from "../../Components/Form/Form.js";
import Result from "../../Components/Form/Result.js";

export default class MCPServers
{
	constructor(layout)
	{
		this.layout = layout;
		this.items = [];
		this.reload_result = new Result();
		this.crud = new Crud(this);
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
	findItemById(pk)
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
		var result = await this.layout.api.call("load_mcp");
		if (!result.isSuccess()) return;
		
		this.items = [];
		for (const item of result.response.items)
		{
			this.items.push(item);
		}
	}
	
	
	/**
	 * Reload tools
	 */
	async reloadTools()
	{
		await this.save();
		
		this.reload_result.setWaitMessage();
		
		const id = this.form.getPrimaryKey();
		const result = await this.layout.api.call("reload_server", id);
		
		this.reload_result.setApiResult(result);
		
		if (result.isSuccess() && this.form.item && this.form.item.id == id)
		{
			this.form.item.tools = result.response.item.tools;
		}
	}
	
	
	/**
	 * Add item
	 */
	async add()
	{
		const item = this.form.getItem();
		const result = await this.layout.api.call("save_mcp", {item});
		if (result.isSuccess())
		{
			this.items.push(result.response.item);
			this.load();
		}
		return result;
	}
	
	
	/**
	 * Save item
	 */
	async save()
	{
		const pk = this.form.getPrimaryKey();
		const item = this.form.getItem();
		const result = await this.layout.api.call("save_mcp",
			{ id: pk, item: item }
		)
		if (result.isSuccess())
		{
			this.load();
		}
		return result;
	}
	
	
	/**
	 * Delete item
	 */
	async delete()
	{
		const pk = this.form.getPrimaryKey();
		const result = await this.layout.api.call("delete_mcp", pk);
		if (result.isSuccess())
		{
			this.load();
		}
		return result;
	}
}
