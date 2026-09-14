import Crud from "@main/Components/Crud.js";
import Form from "@main/Components/Form/Form.js";
import Result from "@main/Components/Form/Result.js";
import { ApiResult } from "@main/lib.js";

class MCPServers
{
	constructor(layout)
	{
		this.layout = layout;
		this.crud = new Crud(this);
		this.items = [];
		this.form = new Form();
		this.form.setDefault({
			"id": "",
			"name": "",
			"type": "server",
			"url": "",
			"command": "",
			"args": "",
			"prefix": "",
			"enabled": true,
			"env": [],
			"tools": [],
		});
		this.update_result = new Result();
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
	 * Generate unique id
	 */
	generateId()
	{
		return "mcp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6);
	}


	/**
	 * Load servers from backend
	 */
	async load()
	{
		var result = await this.layout.api.call("load_mcp_servers");
		if (!result.isSuccess()) return;

		this.items = [];
		for (var i = 0; i < result.response.items.length; i++)
		{
			var item = result.response.items[i];
			item.pk = item.id;
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
	 * Prepare form item for display
	 */
	prepareFormItem(item)
	{
		var copy = Object.assign({}, item);

		// Convert args array to string for editing
		if (Array.isArray(copy.args))
		{
			copy.args = copy.args.join(" ");
		}

		// Ensure env is array
		if (!Array.isArray(copy.env))
		{
			copy.env = [];
		}

		// Ensure tools is array
		if (!Array.isArray(copy.tools))
		{
			copy.tools = [];
		}

		return copy;
	}


	/**
	 * Prepare form item for save
	 */
	prepareForSave(item)
	{
		var copy = Object.assign({}, item);

		// Convert args string back to array
		if (typeof copy.args === "string")
		{
			copy.args = copy.args
				.split(/\s+/)
				.filter((a) => a.length > 0);
		}

		// Generate id for new items
		if (!copy.id)
		{
			copy.id = this.generateId();
		}

		return copy;
	}


	/**
	 * Add new server
	 */
	async add()
	{
		var item = this.prepareForSave(this.form.getItem());

		var result = await this.layout.api.call("save_mcp_server", {
			id: null,
			item: item,
		});

		if (result.isSuccess())
		{
			this.items.push(item);
		}

		this.form.setPrimaryKey(item.id);
		return result;
	}


	/**
	 * Save existing server
	 */
	async save()
	{
		var index = this.items.findIndex(
			(item) => item.id == this.form.pk
		);
		if (index == -1)
		{
			return new ApiResult({ success: false });
		}

		var item = this.prepareForSave(this.form.getItem());

		var result = await this.layout.api.call("save_mcp_server", {
			id: this.form.pk,
			item: item,
		});

		if (result.isSuccess())
		{
			this.items[index] = item;
		}

		return result;
	}


	/**
	 * Delete server
	 */
	async delete()
	{
		var index = this.items.findIndex(
			(item) => item.id == this.form.pk
		);
		if (index == -1)
		{
			return new ApiResult({ success: false });
		}

		var result = await this.layout.api.call(
			"delete_mcp_server",
			this.form.pk
		);

		if (result.isSuccess())
		{
			this.items.splice(index, 1);
		}

		return result;
	}


	/**
	 * Update tools for a single server
	 */
	async updateTools(id)
	{
		this.update_result.setWaitMessage();

		var result = await this.layout.api.call(
			"update_mcp_tools",
			id
		);

		this.update_result.setApiResult(result);

		if (result.isSuccess())
		{
			// Update local tools list
			var server = this.findItemById(id);
			if (server && result.response.tools)
			{
				server.tools = result.response.tools;
			}
			result.message = "Tools updated successfully";
		}

		return result;
	}


	/**
	 * Update tools for all servers
	 */
	async updateAllTools()
	{
		this.update_result.setWaitMessage();

		var result = await this.layout.api.call(
			"update_all_mcp_tools"
		);

		this.update_result.setApiResult(result);

		if (result.isSuccess())
		{
			// Update all servers' tools
			for (var id in result.response.items)
			{
				var server = this.findItemById(id);
				var serverResult = result.response.items[id];
				if (server && serverResult.success)
				{
					server.tools = serverResult.tools;
				}
			}
			result.message = "All servers updated";
		}

		return result;
	}


	/**
	 * Add env variable
	 */
	addEnv()
	{
		if (!this.form.item.env) this.form.item.env = [];
		this.form.item.env.push({ key: "", value: "" });
	}


	/**
	 * Remove env variable
	 */
	removeEnv(index)
	{
		this.form.item.env.splice(index, 1);
	}


	/**
	 * Get tools list for display
	 */
	getToolsList(item)
	{
		if (!item || !item.tools) return [];
		return item.tools.map((tool) => ({
			name: item.prefix
				? item.prefix + "_" + tool.name
				: tool.name,
			description: tool.description || "",
		}));
	}
}

export default MCPServers;