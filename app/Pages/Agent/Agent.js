import Crud from "@main/Components/Crud.js";
import Form from "@main/Components/Form/Form.js";
import { ApiResult } from "@main/lib.js";

class Agent
{
	constructor(layout)
	{
		this.layout = layout;
		this.crud = new Crud(this);
		this.items = [];
		this.form = new Form();
		this.form.setDefault({
			"name": "",
			"model": 0,
			"prompt": "",
		});
	}
	
	
	/**
	 * Find item by id
	 */
	findItemById(pk)
	{
		return this.items.find((item) => item.name == pk.name && item.global == pk.global);
	}
	
	
	/**
	 * Returns primary key
	 */
	getPrimaryKey(item)
	{
		return { name: item.name, global: item.global };
	}
	
	
	/**
	 * Set global
	 */
	setGlobal(global)
	{
		this.form.item.global = global;
	}
	
	
	/**
	 * Load
	 */
	async load()
	{
		var result = await this.layout.api.call("load_agents");
		if (!result.isSuccess()) return;
		
		this.items = [];
		for (var i=0; i<result.response.items.length; i++)
		{
			var item = result.response.items[i];
			item.pk = { name: item.name, global: item.global };
			this.items.push(item);
		}
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
	 * Add rule
	 */
	addRule()
	{
		this.form.item.rules.push("");
	}
	
	
	/**
	 * Remove rule
	 */
	removeRule(index)
	{
		this.form.item.rules.splice(index);
	}
	
	
	/**
	 * Add item
	 */
	async add()
	{
		var item = this.form.getItem();
		
		/* Save item */
		var result = await this.layout.api.call("save_agent", {item});
		if (result.isSuccess())
		{
			this.items.push(item);
		}
		
		/* Reload models */
		this.load();
		
		return result;
	}
	
	
	/**
	 * Save item
	 */
	async save()
	{
		var index = this.items.findIndex((item) => item.name == this.form.pk.name &&
			item.global == this.form.pk.global);
		if (index == -1)
		{
			return new ApiResult({
				"success": false,
			});
		}
		
		/* Save item */
		var item = this.form.getItem();
		var result = await this.layout.api.call("save_agent", {id: this.form.getPrimaryKey(), item});
		if (result.isSuccess())
		{
			this.items[index] = this.form.getItem();
		}
		
		/* Reload models */
		this.load();
		
		return result;
	}
	
	
	/**
	 * Delete item
	 */
	async delete()
	{
		var index = this.items.findIndex((item) => item.name == this.form.pk.name &&
			item.global == this.form.pk.global);
		if (index == -1)
		{
			return new ApiResult({
				"success": false,
			});
		}
		
		/* Delete item */
		var result = await this.layout.api.call("delete_agent", this.form.getPrimaryKey());
		if (result.isSuccess())
		{
			this.items.splice(index, 1);
		}
		
		/* Reload models */
		this.load();
		
		return result;
	}
}

export default Agent;