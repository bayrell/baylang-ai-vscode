import Result from "@main/Components/Form/Result.js";

class Form
{
	constructor()
	{
		this.pk = null;
		this.item = {};
		this.default_item = {};
		this.errors = {};
		this.result = new Result();
	}
	
	
	/**
	 * Set api result
	 */
	setApiResult(result)
	{
		this.result.setApiResult(result);
	}
	
	
	/**
	 * Set default item
	 */
	setDefault(item)
	{
		this.default_item = item;
	}
	
	
	/**
	 * Set item
	 */
	setItem(item)
	{
		this.item = JSON.parse(JSON.stringify(item));
	}
	
	
	/**
	 * Set primary key
	 */
	setPrimaryKey(pk)
	{
		this.pk = JSON.parse(JSON.stringify(pk));
	}
	
	
	/**
	 * Returns item
	 */
	getItem()
	{
		return JSON.parse(JSON.stringify(this.item));
	}
	
	
	/**
	 * Clear
	 */
	clear()
	{
		this.pk = null;
		this.item = JSON.parse(JSON.stringify(this.default_item));
		this.errors = {};
		this.result.clear();
	}
}
export default Form;