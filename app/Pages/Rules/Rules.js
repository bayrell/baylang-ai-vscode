import Crud from "@main/Components/Crud.js";
import Form from "@main/Components/Form/Form.js";
import { ApiResult } from "@main/lib.js";

class Rules
{
	constructor(layout)
	{
		this.layout = layout;
		this.crud = new Crud(this);
		this.items = [];
		this.form = new Form();
		this.form.setDefault({
			"name": "",
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
	 * Load
	 */
	async load()
	{
		var result = await this.layout.api.call("load_rules");
		if (!result.isSuccess()) return;
		
		this.items = [];
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
		var result = await this.layout.api.call("save_rule", item);
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
		var result = await this.layout.api.call("save_rule", item);
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
		var result = await this.layout.api.call("delete_rule", this.form.pk);
		if (result.isSuccess())
		{
			this.items.splice(index, 1);
		}
		
		return result;
	}
}
export default Rules;