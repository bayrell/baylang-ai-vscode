import Crud from "@main/Components/Crud.js";
import Form from "@main/Components/Form/Form.js";
import { ApiResult } from "@main/lib.js";

class Models
{
	constructor(layout)
	{
		this.layout = layout;
		this.crud = new Crud(this);
		this.items = [];
		this.form = new Form();
		this.form.setDefault({
			"name": "",
			"model": "",
			"settings": {},
		});
	}
	
	
	/**
	 * Find item by id
	 */
	findItemById(name)
	{
		return this.items.find((item) => item.name == name);
	}
	
	
	/**
	 * Returns primary key
	 */
	getPrimaryKey(item)
	{
		return item.name;
	}
	
	
	/**
	 * Reload models
	 */
	async reloadModels(name)
	{
		var model = this.findItemById(name);
		if (!model) return null;
		
		var result = await this.layout.api.call("reload_models", name);
		if (result.isSuccess())
		{
			model.models = result.response.items;
		}
		return result;
	}
	
	
	/**
	 * Load
	 */
	async load()
	{
		var result = await this.layout.api.call("load_models");
		if (!result.isSuccess()) return;
		
		for (var i=0; i<result.response.items.length; i++)
		{
			var item = result.response.items[i];
			this.items.push(item);
		}
	}
	
	
	/**
	 * Add item
	 */
	async add()
	{
		var item = this.form.getItem();
		
		/* Save item */
		var result = await this.layout.api.call("save_model", {item});
		if (result.isSuccess())
		{
			this.items.push(item);
		}
		
		return result;
	}
	
	
	/**
	 * Save item
	 */
	async save()
	{
		var index = this.items.findIndex((item) => item.name == this.form.pk);
		if (index == -1)
		{
			return new ApiResult({
				"success": false,
			});
		}
		
		/* Save item */
		var item = this.form.getItem();
		var result = await this.layout.api.call("save_model", {id: this.form.pk, item});
		if (result.isSuccess())
		{
			this.items[index] = this.form.getItem();
		}
		
		return result;
	}
	
	
	/**
	 * Delete item
	 */
	async delete()
	{
		var index = this.items.findIndex((item) => item.name == this.form.pk);
		if (index == -1)
		{
			return new ApiResult({
				"success": false,
			});
		}
		
		/* Delete item */
		var result = await this.layout.api.call("delete_model", this.form.pk);
		if (result.isSuccess())
		{
			this.items.splice(index, 1);
		}
		
		return result;
	}
}

export default Models;