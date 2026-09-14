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
		this.tools_data = [];
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
			this.items.push(Object.assign(item, { "id": i }));
		}
	}
	
	
	/**
	 * Open page
	 */
	async open()
	{
		this.crud.showList();
		await this.load();
		
		/* Load tools */
		this.tools_data = await this.loadAvailableTools();
	}
	
	
	/**
	 * Add rule
	 */
	addRule()
	{
		if (!this.form.item.rules) this.form.item.rules = [];
		this.form.item.rules.push("");
	}
	
	
	/**
	 * Remove rule
	 */
	removeRule(index)
	{
		this.form.item.rules.splice(index, 1);
	}
	
	
	/**
	 * Set tool enabled state
	 */
	setToolEnabled(toolName, enabled)
	{
		if (!this.form.item.enabled_tools)
		{
			this.form.item.enabled_tools = {};
		}
		this.form.item.enabled_tools[toolName] = enabled;
	}
	
	
	/**
	 * Toggle tool state
	 */
	toggleTool(toolName)
	{
		var current = this.isToolEnabled(toolName);
		this.setToolEnabled(toolName, !current);
	}
	
	
	/**
	 * Check if tool is enabled
	 */
	isToolEnabled(toolName)
	{
		if (!this.form.item.enabled_tools) return true;
		if (!this.form.item.enabled_tools.hasOwnProperty(toolName))
		{
			return true;
		}
		return this.form.item.enabled_tools[toolName] === true;
	}
	
	
	/**
	 * Get all available tools grouped by source
	 */
	async loadAvailableTools()
	{
		var result = await this.layout.api.call("load_mcp_servers");
		if (!result.isSuccess()) return { built_in: [], mcp: [] };

		var builtInTools = [
			"random",
			"write_file",
			"read_file",
			"list_files",
			"rename_file",
			"delete_file",
			"find_file_by_name",
			"run_tool",
			"tools_list",
			"search_files",
		];

		var mcpTools = [];
		for (var i = 0; i < result.response.items.length; i++)
		{
			var server = result.response.items[i];
			if (!server.tools) continue;

			for (var j = 0; j < server.tools.length; j++)
			{
				var tool = server.tools[j];
				var fullName = server.prefix
					? server.prefix + "_" + tool.name
					: tool.name;

				mcpTools.push({
					name: fullName,
					description: tool.description || "",
					server_name: server.name,
					server_id: server.id,
				});
			}
		}

		return {
			built_in: builtInTools,
			mcp: mcpTools,
		};
	}
	
	
	/**
	 * Enable all tools
	 */
	enableAllTools(toolsList)
	{
		if (!this.form.item.enabled_tools)
		{
			this.form.item.enabled_tools = {};
		}
		for (var i = 0; i < toolsList.length; i++)
		{
			this.form.item.enabled_tools[toolsList[i]] = true;
		}
	}
	
	
	/**
	 * Disable all tools
	 */
	disableAllTools(toolsList)
	{
		if (!this.form.item.enabled_tools)
		{
			this.form.item.enabled_tools = {};
		}
		for (var i = 0; i < toolsList.length; i++)
		{
			this.form.item.enabled_tools[toolsList[i]] = false;
		}
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