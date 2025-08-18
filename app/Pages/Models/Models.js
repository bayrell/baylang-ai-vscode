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
	findItemById(id)
	{
		return this.items.find((item) => item.id == id);
	}
	
	
	/**
	 * Returns primary key
	 */
	getPrimaryKey(item)
	{
		return item.id;
	}
	
	
	/**
	 * Load
	 */
	async load()
	{
		var result = await this.layout.api.call("load_models");
		console.log(result);
	}
	
	
	/**
	 * Add item
	 */
	async add()
	{
		var item = this.form.getItem();
		item.id = this.crud.generateId();
		this.items.push(item);
		var result = new ApiResult();
		result.assign({
			"success": true,
			"message": "Ok",
		})
		return result;
	}
	
	
	/**
	 * Save item
	 */
	async save()
	{
		var index = this.items.findIndex((item) => item.id == this.form.pk);
		if (index >= 0) this.items[index] = this.form.getItem();
		var result = new ApiResult();
		result.assign({
			"success": true,
			"message": "Ok",
		})
		return result;
	}
	
	
	/**
	 * Delete item
	 */
	async delete()
	{
		var index = this.items.findIndex((item) => item.id == this.form.pk);
		if (index >= 0) this.items.splice(index, 1);
		var result = new ApiResult();
		result.assign({
			"success": true,
			"message": "Ok",
		})
		return result;
	}
}

export default Models;