export class MCPServer
{
	constructor(config, settings)
	{
		this.id = config.id;
		this.name = config.name;
		this.type = config.type;          // "server" or "cli"
		this.url = config.url || "";       // for type "server"
		this.command = config.command || ""; // for type "cli"
		this.args = config.args || [];     // for type "cli"
		this.prefix = config.prefix || "";
		this.enabled = config.enabled !== false;
		this.env = config.env || [];
		this.tools = config.tools || [];
		this.process = null;               // child process for CLI
		this.connected = false;
		this.settings = settings;
	}
	
	
	/**
	 * Returns version
	 */
	getVersion()
	{
		return "2025-06-18";
	}
	

	/**
	 * Build environment object from env array
	 */
	buildEnv()
	{
		var result = Object.assign({}, process.env);
		for (var i = 0; i < this.env.length; i++)
		{
			var item = this.env[i];
			if (item.key && item.value !== undefined)
			{
				result[item.key] = String(item.value);
			}
		}
		return result;
	}


	/**
	 * Connect to MCP server
	 */
	async connect()
	{
		if (this.type == "server")
		{
			await this.connectHTTP();
		}
		else if (this.type == "cli")
		{
			if (this.connected && this.process != null) return;
			await this.connectCLI();
		}
		if (this.connected)
		{
			await this.sendRequest("initialize", {
				"protocolVersion": this.getVersion(),
				"capabilities": {},
				"clientInfo": {
					"name": this.settings.getAppName(),
					"version": this.settings.getAppVersion(),
				},
			});
		}
	}


	/**
	 * Connect to HTTP/SSE MCP server
	 */
	async connectHTTP()
	{
		// Will be implemented using fetch with SSE
		// For HTTP transport, we send JSON-RPC messages to the URL
		this.connected = true;
	}


	/**
	 * Connect to CLI (stdio) MCP server
	 */
	async connectCLI()
	{
		var { spawn } = await import("child_process");

		return new Promise((resolve, reject) =>
		{
			this.process = spawn(this.command, this.args, {
				env: this.buildEnv(),
				stdio: ["pipe", "pipe", "pipe"],
				cwd: this.settings.workspaceFolderPath,
			});

			this.process.on("error", (err) =>
			{
				this.connected = false;
				reject(err);
			});

			this.process.on("close", () =>
			{
				this.connected = false;
			});

			// Wait for initialization response
			this.connected = true;
			resolve();
		});
	}


	/**
	 * Send JSON-RPC request to server
	 */
	async sendRequest(method, params)
	{
		if (!this.connected)
		{
			await this.connect();
		}
		
		var request_id = "mcp-" + Date.now();
		var request = {
			jsonrpc: "2.0",
			id: request_id,
			method: method,
			params: params || {},
		};

		if (this.type == "cli")
		{
			return await this.sendRequestCLI(request);
		}
		else
		{
			return await this.sendRequestHTTP(request);
		}
	}


	/**
	 * Send request via CLI (stdio)
	 */
	async sendRequestCLI(request)
	{
		return new Promise((resolve, reject) =>
		{
			var response_data = "";
			var timeout = setTimeout(() =>
			{
				reject(new Error("MCP request timeout"));
			}, 30000);

			var onData = (chunk) =>
			{
				response_data += chunk.toString();
				try
				{
					var response = JSON.parse(response_data);
					clearTimeout(timeout);
					this.process.stdout.removeListener("data", onData);
					if (response.error)
					{
						reject(new Error(response.error.message));
					}
					resolve(response);
				}
				catch (e)
				{
					// Wait for more data
				}
			};

			this.process.stdout.on("data", onData);
			this.process.stdin.write(JSON.stringify(request) + "\n");
		});
	}


	/**
	 * Send request via HTTP
	 */
	async sendRequestHTTP(request)
	{
		var response = await fetch(this.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"MCP-Protocol-Version": this.getVersion(),
			},
			body: JSON.stringify(request),
		});

		if (!response.ok)
		{
			throw new Error("HTTP error: " + response.status);
		}

		return await response.json();
	}


	/**
	 * Fetch tools list from server
	 */
	async fetchTools()
	{
		var response = await this.sendRequest("tools/list", {});
		if (response && response.result && response.result.tools)
		{
			this.tools = response.result.tools;
		}
		return this.tools;
	}


	/**
	 * Call a tool on this server
	 */
	async callTool(toolName, args)
	{
		var response = await this.sendRequest("tools/call", {
			name: toolName,
			arguments: args,
		});

		if (response.error)
		{
			throw new Error(response.error.message);
		}

		return response.result;
	}


	/**
	 * Disconnect from server
	 */
	async disconnect()
	{
		if (this.process)
		{
			this.process.kill();
			this.process = null;
		}
		this.connected = false;
	}


	/**
	 * Get config data
	 */
	getConfig()
	{
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			url: this.url,
			command: this.command,
			args: this.args,
			prefix: this.prefix,
			enabled: this.enabled,
			env: this.env,
			tools: this.tools,
		};
	}
}