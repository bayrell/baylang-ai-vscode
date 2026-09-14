import { MCPServer } from "./MCPServer.js";
import { MCPServerTool } from "../Tools/MCPServerTool.js";

export class MCPServerManager
{
	constructor(settings)
	{
		this.settings = settings;
		this.servers = [];
	}


	/**
	 * Load servers from settings
	 */
	loadServers()
	{
		var configs = this.settings.data.mcp_servers || [];
		this.servers = [];

		for (var i = 0; i < configs.length; i++)
		{
			var server = new MCPServer(configs[i], this.settings);
			this.servers.push(server);
		}
	}


	/**
	 * Save servers to settings
	 */
	async saveServers()
	{
		var configs = this.servers.map((s) => s.getConfig());
		this.settings.data.mcp_servers = configs;
		await this.settings.saveData();
	}


	/**
	 * Add new server
	 */
	addServer(config)
	{
		var server = new MCPServer(config, this.settings);
		this.servers.push(server);
		return server;
	}


	/**
	 * Remove server by id
	 */
	removeServer(id)
	{
		var index = this.servers.findIndex((s) => s.id == id);
		if (index >= 0)
		{
			this.servers[index].disconnect();
			this.servers.splice(index, 1);
		}
	}


	/**
	 * Get server by id
	 */
	getServer(id)
	{
		return this.servers.find((s) => s.id == id);
	}


	/**
	 * Update tools for a specific server
	 */
	async updateServerTools(id)
	{
		var server = this.getServer(id);
		if (!server) throw new Error("Server not found");

		await server.disconnect();
		if (!server.connected) await server.connect();

		await server.fetchTools();
		await this.saveServers();
		return server.tools;
	}


	/**
	 * Update tools for all servers
	 */
	async updateAllTools()
	{
		var results = {};
		for (var i = 0; i < this.servers.length; i++)
		{
			var server = this.servers[i];
			if (!server.enabled) continue;

			try
			{
				await server.disconnect();
				if (!server.connected)
				{
					await server.connect();
				}
				await server.fetchTools();
				results[server.id] = {
					success: true,
					tools: server.tools,
				};
			}
			catch (e)
			{
				results[server.id] = {
					success: false,
					error: e.message,
				};
			}
		}

		await this.saveServers();
		return results;
	}


	/**
	 * Create dynamic tools from all servers
	 * Returns array of MCPServerTool instances
	 */
	createDynamicTools()
	{
		var tools = [];

		for (var i = 0; i < this.servers.length; i++)
		{
			var server = this.servers[i];
			if (!server.enabled || !server.tools) continue;

			for (var j = 0; j < server.tools.length; j++)
			{
				var toolDef = server.tools[j];
				var tool = new MCPServerTool(server, toolDef);
				tools.push(tool);
			}
		}

		return tools;
	}


	/**
	 * Call a tool on a server
	 */
	async callTool(serverId, toolName, args)
	{
		var server = this.getServer(serverId);
		if (!server) throw new Error("Server not found");

		if (!server.connected)
		{
			await server.connect();
		}

		return await server.callTool(toolName, args);
	}


	/**
	 * Disconnect all servers
	 */
	disconnectAll()
	{
		for (var i = 0; i < this.servers.length; i++)
		{
			this.servers[i].disconnect();
		}
	}
}