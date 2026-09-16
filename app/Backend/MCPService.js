import { spawn } from "child_process";
import { MCPServerTool } from "../Tools/MCPServerTool";
import { generate_uuid } from "../lib";

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
		if (item.id != undefined) this.id = item.id;
		if (item.name != undefined) this.name = item.name;
		if (item.type != undefined) this.type = item.type;
		if (item.url != undefined) this.url = item.url;
		if (item.command != undefined) this.command = item.command;
		if (item.args != undefined) this.args = item.args;
		if (item.prefix != undefined) this.prefix = item.prefix;
		if (item.enabled != undefined) this.enabled = item.enabled;
		if (item.env != undefined) this.env = item.env;
		if (item.tools != undefined) this.tools = item.tools;
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
		return "2025-06-18";
	}
	
	getToolName(name)
	{
		return this.prefix + "_" + name;
	}
	
	getEnv()
	{
		const result = {};
		for (const item of this.env)
		{
			const value = item["key"];
			result[value] = item["value"];
		}
		return result;
	}
	
	async connect()
	{
		if (this.isConnected()) return;
	}
	
	async disconnect(err)
	{
		this.connected = false;
		this.buffer = "";
		for (const request_id in this.listeners)
		{
			const listener = this.listeners[request_id];
			const reject = listener.reject;
			if (reject)
			{
				if (err) reject (err);
				else reject(new Error("Disconnected"));
			}
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
		data = data.toString("utf-8");
		
		this.buffer += data;
		const lines = this.buffer.split("\n");
		
		this.buffer = lines.pop();
		for (let line of lines)
		{
			this.addLine(line.trim());
		}
	}
	
	addLine(line)
	{
		try
		{
			const response = JSON.parse(line);
			const request_id = response.id;
			if (this.listeners[request_id])
			{
				const resolve = this.listeners[request_id].resolve;
				if (resolve) resolve(response);
			}
			else
			{
				this.listeners[request_id] = {
					"response": response,
				};
			}
		}
		catch (e)
		{
			throw new Error("JSON Parse");
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
	
	async reloadTools()
	{
		const response = await this.send("tools/list");
		if (response.result)
		{
			this.tools = response.result.tools;
		}
	}
	
	async execute(name, params)
	{
		const response = await this.send("tools/call", {
			name: name,
			arguments: params,
		})
		if (!response)
		{
			throw new Error("Response is null");
		}
		if (response.error)
		{
			throw new Error(response.error.message);
		}
		return response.result.content
			.filter(item => item.type == "text")
			.map(item => item.text.trim())
			.filter(item => item != "")
			.join(" ")
		;
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
		
		return new Promise((resolve, reject) => {
		
			try
			{
				this.process = spawn(
					this.command, this.args, {
						stdio: ["pipe", "pipe", "pipe"],
						cwd: this.settings.workspaceFolderPath,
						env: this.getEnv(),
						timeout: this.connectionTimeout,
					}
				);
			}
			catch (e)
			{
				reject(new Error("Server connection error"));
				return;
			}
			
			this.process.stdout.on("data", (data) => {
				this.addLine(data.toString("utf-8"));
			});
			
			this.process.stderr.on("data", (data) => {
				/*this.addBuffer(data);*/
			});
			
			this.process.on("error", (err) => {
				reject(err);
				this.disconnect(err);
			})
			
			this.process.on("close", (code) => {
				this.disconnect();
			});
			
			this.connected = true;
			resolve();
			
		}).then(() => { return this.init(); });
	}
	
	async disconnect(err)
	{
		await super.disconnect(err);
		this.process = null;
	}
	
	async send(method_name, params, timeout)
	{
		if (timeout == undefined) timeout = 60 * 1000;
		if (params == undefined) params = {};
		if (!this.isConnected())
		{
			await this.connect();
		}
		
		this.request_id += 1;
		
		const response = this.readResponse(
			this.request_id, timeout
		);
		
		const request = {
			"jsonrpc": "2.0",
			"id": this.request_id,
			"method": method_name,
			"params": params,
		};
		this.process.stdin.write(JSON.stringify(request));
		this.process.stdin.write("\n");
		
		return await response;
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
	 * Generate unique server id
	 */
	generateId()
	{
		let result = "";
		while (result == "" || this.findById(result))
		{
			result = "server-" + generate_uuid();
		}
		return result;
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
			.map(item => createMCP(this.settings, item))
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
			if (!server.tools) continue;
			for (const tool of server.tools)
			{
				tools.push(new MCPServerTool(
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
		const server = createMCP(this.settings, data);
		server.id = this.generateId();
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
	deleteServer(id)
	{
		const index = this.servers.findIndex(
			item => item.id == id
		);
		if (index >= 0)
		{
			const server = this.servers[index];
			server.disconnect();
			this.servers.splice(index, 1);
		}
	}
}

export function createMCP(settings, data)
{
	let item = null;
	if (data.type == "cli") item = new MCPClientCli(settings);
	else if (data.type == "server") item = new MCPClientServer(settings);
	else item = new MCPClient(settings);
	
	if (item)
	{
		item.assign(data);
	}
	
	return item;
};
