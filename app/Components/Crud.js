class Crud
{
	constructor(model)
	{
		this.lastId = 0;
		this.model = model;
		this.show_save = false;
		this.show_delete = false;
	}
	generateId()
	{
		this.lastId++;
		return this.lastId;
	}
	isAdd()
	{
		return this.model.form.pk == null;
	}
	showAdd()
	{
		this.model.form.clear();
		this.show_save = true;
	}
	showEdit(id)
	{
		var item = this.model.findItemById(id);
		if (!item) return;
		this.model.form.clear();
		this.model.form.setPrimaryKey(this.model.getPrimaryKey(item));
		this.model.form.setItem(item);
		this.show_save = true;
	}
	showDelete(id)
	{
		var item = this.model.findItemById(id);
		if (!item) return;
		this.model.form.clear();
		this.model.form.setPrimaryKey(this.model.getPrimaryKey(item));
		this.model.form.setItem(item);
		this.show_delete = true;
	}
	async addItem()
	{
		var result = await this.model.add();
		this.model.form.setApiResult(result);
		if (result.isSuccess())
		{
			this.show_save = false;
		}
	}
	async saveItem()
	{
		var result = await this.model.save();
		this.model.form.setApiResult(result);
		if (result.isSuccess())
		{
			this.show_save = false;
		}
	}
	async deleteItem()
	{
		var result = await this.model.delete();
		this.model.form.setApiResult(result);
		if (result.isSuccess())
		{
			this.show_delete = false;
		}
	}
	cancel()
	{
		this.show_save = false;
		this.show_delete = false;
	}
}
export default Crud;