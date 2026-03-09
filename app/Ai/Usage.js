import { promises as fs } from "fs";
import path from "path";

export class Usage
{
	constructor(settings)
	{
		this.total = {};
		this.items = {};
		this.settings = settings;
	}
	
	
	/**
	 * Add usage
	 */
	add(data)
	{
		if (!data) return;
		
		this.addTotal(stat);
		this.addStat(stat);
	}
	
	
	/**
	 * Add total
	 */
	addTotal(data)
	{
		var total = this.total;
		if (!total.tokens) total.tokens = 0;
		if (!total.input_tokens) total.input_tokens = 0;
		if (!total.prompt_tokens) total.prompt_tokens = 0;
		if (!total.cost) total.cost = 0;
		if (data.total_tokens)
		{
			total.tokens += data.total_tokens;
			if (data.prompt_tokens)
			{
				total.prompt_tokens += data.prompt_tokens;
				total.input_tokens += data.total_tokens - data.prompt_tokens;
			}
		}
		if (data.cost) total.cost += data.cost;
	}
	
	
	/**
	 * Add stat
	 */
	addStat(data)
	{
		var date = new Date();
		var current = date.getFullYear() * 12 +
			date.getMonth();
		
		if (!this.items) this.items = {};
		if (!this.items[current]) this.items[current] = {};
		
		var item = this.items[current];
		if (!item.tokens) item.tokens = 0;
		if (!item.prompt_tokens) item.prompt_tokens = 0;
		if (!item.input_tokens) item.input_tokens = 0;
		if (!item.cost) item.cost = 0;
		if (data.total_tokens)
		{
			item.tokens += data.tokens;
			if (data.prompt_tokens)
			{
				item.prompt_tokens += data.prompt_tokens;
				item.input_tokens += data.total_tokens - data.prompt_tokens;
			}
		}
		if (data.cost) item.cost += data.cost;
	}
	
	
	/**
	 * Returns usage file path
	 */
	getFilePath()
	{
		var file_path = path.join(
			this.settings.folderPath, "chat",
			this.settings.workspaceFolderHash, "usage.json"
		);
		return file_path;
	}
	
	
	/**
	 * Load data
	 */
	async loadData()
	{
		var file_path = this.getFilePath();
		
		/* Read file */
		var data = null;
		try
		{
			var content = await fs.readFile(file_path, "utf8");
			data = JSON.parse(content);
		}
		catch (error)
		{
			return;
		}
		
		if (!data) return;
		
		/* Init data */
		if (data.total) this.total = data.total;
		if (data.items) this.items = data.items;
	}
	
	
	/**
	 * Save usage
	 */
	async save()
	{
		var file_path = this.getFilePath();
		var data = {
			total: this.total,
			items: this.items,
		};
		
		/* Create dir */
		const dir_name = path.dirname(file_path);
		try
		{
			await fs.mkdir(dir_name, { recursive: true });
		}
		catch (error)
		{
			return;
		}
		
		/* Save file */
		try
		{
			var content = JSON.stringify(data);
			await fs.writeFile(file_path, content, { encoding: "utf8" });
		}
		catch (error)
		{
		}
	}
}