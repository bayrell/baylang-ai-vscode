import { spawn } from "child_process";
import { MCPServerTool } from "../Tools/MCPServerTool";

export class MCPClient
{
	constructor(settings)
	{
		this.settings = settings;
		this.id = "";
		this.name = "";
		this.type = "";
		this.url = "";
		this.command = "";
		this.args = [];
		this.prefix = "";
		this.enabled = false;
		this.env = [];
		this.tools = [];
		this.connected = false;
		this.connectionTimeout = 30 * 1000;
		this.request_id = 0;
		this.buffer = "";
		this.listeners = {};
	}
	
	assign(item)
	{
		if (item.id) this.id = item.id;
		if (item.name) this.name = item.name;
		if (item.type) this.type = item.type;
		if (item.url) this.url = item.url;
		if (item.command) this.command = item.command;
		if (item.args) this.args = item.args;
		if (item.prefix) this.prefix = item.prefix;
		if (item.enabled) this.enabled = item.enabled;
		if (item.env) this.env = item.env;
		if (item.tools) this.tools = item.tools;
	}
	
	getData()
	{
		return {
			"id": this.id,
			"name": this.name,
			"type": this.type,
			"url": this.url,
			"command": this.command,
			"args": this.args,
			"prefix": this.prefix,
			"enabled": this.enabled,
			"env": this.env,
			"tools": this.tools,
		};
	}
	
	isConnected()
	{
		return this.connected;
	}
	
	getProtocolVersion()
	{
		return "2026-07-28";
	}
	
	getToolName()
	{
		return this.prefix + "_" + this.name;
	}
	
	async connect()
	{
		if (this.isConnected()) return;
	}
	
	async disconnect()
	{
		this.connected = false;
		this.buffer = "";
		for (const listener in this.listeners)
		{
			listener.reject(new Error("Disconnected"));
		}
		this.listeners = {};
	}
	
	async init()
	{
		await this.send("initialize", {
			"protocolVersion": this.getProtocolVersion(),
			"capabilities": {},
			"clientInfo":
			{
				"name": this.settings.getAppName(),
				"version": this.settings.getAppVersion()
			}
		});
	}
	
	async send(method_name, params, timeout)
	{
		return null;
	}
	
	addBuffer(data)
	{
		this.buffer += data;
		const lines = this.buffer.split("\n");
		
		this.buffer = lines.pop();
		for (let line in lines)
		{
			this.addLine(line.trim());
		}
	}
	
	addLine(line)
	{
		const response = JSON.parse(line);
		const request_id = response.id;
		if (this.listeners[request_id])
		{
			const resolve = this.listeners[request_id].resolve;
			resolve(line);
		}
		else
		{
			this.listeners[request_id] = {
				"response": response,
			};
		}
	}
	
	removeListener(request_id)
	{
		this.listeners[request_id] = null;
		delete this.listeners[request_id];
	}
	
	async readResponse(request_id, timeout)
	{
		if (this.listeners[request_id])
		{
			const response = this.listeners[request_id].response;
			this.removeListener(request_id);
			return response;
		}
		return new Promise((resolve, reject) => {
			this.listeners[request_id] = {
				"resolve": resolve,
				"reject": reject,
				"response": null,
				"timeout": timeout,
			};
			if (timeout >= 0)
			{
				setTimeout(() => {
					if (this.listeners[request_id])
					{
						this.removeListener(request_id);
						reject(new Error("Timeout"));
					}
				}, timeout);
			}
		});
	}
}

export class MCPClientCli extends MCPClient
{
	constructor(settings)
	{
		super(settings);
		this.process = null;
	}
	
	isConnected()
	{
		return this.connected && this.process != null;
	}
	
	async connect()
	{
		if (this.isConnected()) return;
		
		try
		{
			this.process = spawn(
				this.command, this.args, {
					cwd: this.settings.workspaceFolderPath,
					env: this.env,
					timeout: this.connectionTimeout,
				}
			);
			this.connected = true;
		}
		catch (e)
		{
			throw e;
		}
		
		this.process.stdout.on("data", (data) => {
			this.addBuffer(data);
		});
		
		this.process.stderr.on("data", (data) => {
			this.addBuffer(data);
		});
		
		this.process.on("close", (code) => {
			this.disconnect()
		});
		
		await this.init();
	}
	
	async disconnect()
	{
		await super.disconnect();
		if (this.process)
		{
			this.process.disconnect();
		}
		this.process = null;
	}
	
	async send(method_name, params, timeout)
	{
		if (timeout == undefined) timeout = 60 * 1000;
		if (!this.isConnected())
		{
			await this.connect();
		}
		
		this.request_id += 1;
		
		const request = {
			"jsonrpc": "2.0",
			"id": this.request_id,
			"method": method_name,
			"params": params,
		};
		this.process.stdin.write(JSON.stringify(request));
		this.process.stdin.write("\n");
		
		const response = await this.readResponse(
			this.request_id, timeout
		);
		return response;
	}
}

export class MCPClientServer extends MCPClient
{
	async connect()
	{
		if (this.connected) return;
	}
}

export class MCPService
{
	constructor(settings)
	{
		this.settings = settings;
		this.servers = [];
	}
	
	
	/**
	 * Find server
	 */
	findById(id)
	{
		return this.servers.find(item => item.id == id);
	}
	
	
	/**
	 * Load servers
	 */
	load()
	{
		this.servers = this.settings.loadMCP();
		this.servers = this.servers
			.map(item => createMCP(item))
			.filter(item => item != null)
		;
	}
	
	
	/**
	 * Create tools
	 */
	createTools()
	{
		const tools = [];
		for (const server of this.servers)
		{
			for (const tool of this.servers.tools)
			{
				tools.append(new MCPServerTool(
					tool, server
				));
			}
		}
		return tools;
	}
	
	
	/**
	 * Add new server
	 */
	addServer(data)
	{
		const server = createMCP(data);
		this.servers.push(server);
		return server;
	}
	
	
	/**
	 * Edit server
	 */
	editServer(id, data)
	{
		const server = this.findById(id);
		if (!server) return null;
		
		server.assign(data);
		return server;
	}
	
	
	/**
	 * Delete server
	 */
	async deleteServer(id)
	{
		const index = this.servers.findIndex(
			item => item.id == id
		);
		if (index >= 0)
		{
			const server = this.servers[index];
			await server.disconnect();
			this.servers.splice(index, 1);
		}
	}
}

export function createMCP(data)
{
	let item = null;
	if (data.type == "cli") item = new MCPClientCli();
	else if (data.type == "server") item = new MCPClientServer();
	else item = new MCPClient();
	
	if (item)
	{
		item.assign(data);
	}
	
	return item;
};
