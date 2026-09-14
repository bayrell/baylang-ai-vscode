# MCP Servers Integration — Technical Specification

## Overview

This document describes the integration of Model Context Protocol (MCP) servers
into the AI Assistant VSCode extension. Users will be able to add MCP servers
(both HTTP/SSE and stdio CLI), dynamically create tools from each server's
`tools/list` response, and toggle individual tools per agent.

## Architecture

### Data Flow

```
User configures MCP servers in settings.json
        │
        ▼
MCPServerManager loads server configs
        │
        ├─ For "sse" type: connects via HTTP SSE/Streamable HTTP
        ├─ For "cli" type: spawns child process (stdio transport)
        │
        ▼
Calls tools/list on each server (on "Update" button or startup)
        │
        ▼
Saves tool definitions into settings.json under "mcp_servers" key
        │
        ▼
Dynamic tools are created with prefix: "{prefix}_{original_tool_name}"
        │
        ▼
Agent settings include "enabled_tools" map to toggle individual tools
```

## settings.json Structure

```json
{
  "models": [],
  "memory": [],
  "mcp_servers": [
    {
      "id": "my-http-server",
      "name": "My HTTP Server",
      "type": "server",
      "url": "http://localhost:3000/mcp",
      "prefix": "myserver",
      "enabled": true,
      "env": [
        { "key": "API_KEY", "value": "sk-123" },
        { "key": "DEBUG", "value": "true" }
      ],
      "tools": [
        {
          "name": "get_weather",
          "description": "Get current weather for a location",
          "inputSchema": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "City name"
              }
            },
            "required": ["location"]
          }
        }
      ]
    },
    {
      "id": "my-cli-server",
      "name": "My CLI Tool",
      "type": "cli",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      "prefix": "fs",
      "enabled": true,
      "env": [],
      "tools": []
    }
  ]
}
```

### Agent settings.json (per-agent)

```json
{
  "name": "Default Agent",
  "enabled_tools": {
    "myserver_get_weather": true,
    "fs_read_file": true,
    "fs_write_file": false
  }
}
```

## File Structure

```
app/
├── Backend/
│   ├── MCPServerManager.js     ← NEW: manages MCP server connections
│   ├── MCPServer.js            ← NEW: single MCP server connection
│   ├── Tools.js                ← MODIFIED: add dynamic MCP tools
│   └── CommandRegistry.js      ← MODIFIED: add MCP-related commands
├── Ai/
│   ├── Tool.js                 ← EXISTING: base Tool class
│   └── Agent.js                ← MODIFIED: add enabled_tools map
└── Tools/
    └── MCPServerTool.js        ← NEW: dynamic tool wrapper for MCP
```

## Implementation Details

### 1. MCPServer.js — Single Server Connection

Each MCPServer represents a connection to one MCP server (HTTP or CLI).

```javascript
// app/Backend/MCPServer.js

export class MCPServer
{
	constructor(config)
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
			return await this.connectHTTP();
		}
		else if (this.type == "cli")
		{
			return await this.connectCLI();
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
				"MCP-Protocol-Version": "2026-07-28",
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
	disconnect()
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
```

### 2. MCPServerManager.js — Manages All Servers

```javascript
// app/Backend/MCPServerManager.js

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
			var server = new MCPServer(configs[i]);
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
		var server = new MCPServer(config);
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

		if (!server.connected)
		{
			await server.connect();
		}

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
```

### 3. MCPServerTool.js — Dynamic Tool Wrapper

Each tool fetched from an MCP server becomes an MCPServerTool instance
with a prefixed name.

```javascript
// app/Tools/MCPServerTool.js

import { Tool } from "../Ai/Tool.js";

export class MCPServerTool extends Tool
{
	constructor(server, toolDef)
	{
		super();

		// Tool name: prefix + "_" + original_name
		var fullName = server.prefix
			? server.prefix + "_" + toolDef.name
			: toolDef.name;

		this.setName(fullName);
		this.setDescription(toolDef.description || "");
		this.setPrompt(
			"Use the `" + fullName + "` tool from MCP server '" + server.name + "'. " +
			(toolDef.description || "")
		);

		this.server = server;
		this.toolDef = toolDef;
		this.inputSchema = toolDef.inputSchema || { type: "object", properties: {} };

		// Register properties from inputSchema
		if (this.inputSchema.properties)
		{
			var required = this.inputSchema.required || [];
			for (var key in this.inputSchema.properties)
			{
				var prop = this.inputSchema.properties[key];
				this.addProps({
					key: key,
					type: prop.type || "string",
					description: prop.description || "",
					required: required.includes(key),
				});
			}
		}
	}


	/**
	 * Execute tool via MCP server
	 */
	async execute(params, question)
	{
		var result = await this.server.callTool(
			this.toolDef.name,
			params
		);

		// Extract text from MCP response
		if (result && result.content)
		{
			var texts = [];
			for (var i = 0; i < result.content.length; i++)
			{
				var block = result.content[i];
				if (block.type == "text")
				{
					texts.push(block.text);
				}
			}
			return texts.join("\n");
		}

		return JSON.stringify(result);
	}
}
```

### 4. Changes to Agent.js — Add enabled_tools

```javascript
// In Agent constructor, add:
this.enabled_tools = {};

// In Agent assign(), add:
if (data.enabled_tools) this.enabled_tools = data.enabled_tools;

// In Agent getData(), add:
enabled_tools: this.enabled_tools,

// New method:
isToolEnabled(toolName)
{
	// If enabled_tools is empty, all tools are enabled
	if (Object.keys(this.enabled_tools).length === 0) return true;
	// If tool has explicit setting, use it
	if (this.enabled_tools.hasOwnProperty(toolName))
	{
		return this.enabled_tools[toolName] === true;
	}
	// Default: enabled if no explicit setting
	return true;
}
```

### 5. Changes to Backend/Tools.js — Register Dynamic Tools

```javascript
// Add import
import { MCPServerManager } from "./MCPServerManager.js";

// In registerTools(), after adding static tools:
var mcpManager = new MCPServerManager(settings);
mcpManager.loadServers();
settings.mcpManager = mcpManager;

var mcpTools = mcpManager.createDynamicTools();
for (var i = 0; i < mcpTools.length; i++)
{
	tools.add(mcpTools[i]);
}
```

### 6. New Commands in CommandRegistry.js

```javascript
// Load MCP servers
registry.register("load_mcp_servers", async () => {
    var manager = settings.mcpManager;
    return {
        success: true,
        items: manager.servers.map(s => s.getConfig()),
    };
});

// Save MCP server
registry.register("save_mcp_server", async ({ id, item }) => {
    var manager = settings.mcpManager;
    if (id && manager.getServer(id))
    {
        // Update existing
        var server = manager.getServer(id);
        Object.assign(server, item);
    }
    else
    {
        // Add new
        manager.addServer(item);
    }
    await manager.saveServers();
    return { success: true };
});

// Delete MCP server
registry.register("delete_mcp_server", async (id) => {
    var manager = settings.mcpManager;
    manager.removeServer(id);
    await manager.saveServers();
    return { success: true };
});

// Update MCP server tools
registry.register("update_mcp_tools", async (serverId) => {
    var manager = settings.mcpManager;
    var tools = await manager.updateServerTools(serverId);

    // Recreate dynamic tools
    settings.tools = await registerTools(settings);

    return {
        success: true,
        tools: tools,
    };
});

// Update all MCP servers tools
registry.register("update_all_mcp_tools", async () => {
    var manager = settings.mcpManager;
    var results = await manager.updateAllTools();

    // Recreate dynamic tools
    settings.tools = await registerTools(settings);

    return {
        success: true,
        items: results,
    };
});

// Run MCP tool
registry.register("run_mcp_tool", async ({ serverId, toolName, args }) => {
    var manager = settings.mcpManager;
    var result = await manager.callTool(serverId, toolName, args);
    return {
        success: true,
        data: result,
    };
});
```

## UI Changes (Frontend)

### Settings Page — MCP Servers Tab

A new section in Settings page:

```
┌─────────────────────────────────────────────────┐
│  MCP Servers                          [+ Add]   │
├─────────────────────────────────────────────────┤
│  ☑ My HTTP Server          [Edit] [Update] [🗑] │
│    Type: server | URL: http://localhost:3000/mcp │
│    Prefix: myserver | Tools: 5                   │
│    ┌─────────────────────────────────────────┐   │
│    │ ☑ get_weather  ☑ search_query  ☐ exec  │   │
│    └─────────────────────────────────────────┘   │
│                                                  │
│  ☑ My CLI Tool             [Edit] [Update] [🗑] │
│    Type: cli | Command: npx -y @mcp/server-fs   │
│    Prefix: fs | Tools: 3                        │
│    ┌─────────────────────────────────────────┐   │
│    │ ☑ read_file  ☑ write_file  ☑ list_dir  │   │
│    └─────────────────────────────────────────┘   │
│                                                  │
│              [Update All Servers]                │
└─────────────────────────────────────────────────┘
```

### Agent Settings — Tools Toggle

In the agent editor, when "Enable Tools" is set to "1":

```
┌─────────────────────────────────────────────────┐
│  Available Tools                                 │
├─────────────────────────────────────────────────┤
│  Built-in Tools:                                 │
│    ☑ random          ☑ write_file  ☑ read_file  │
│    ☑ list_files      ☑ rename_file ☑ delete_file│
│                                                  │
│  MCP Tools (myserver):                           │
│    ☑ get_weather     ☑ search_query             │
│                                                  │
│  MCP Tools (fs):                                 │
│    ☑ read_file       ☑ write_file               │
└─────────────────────────────────────────────────┘
```

## MCP Protocol Details

### JSON-RPC Message Format

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "result": {
    "tools": [
      {
        "name": "tool_name",
        "description": "Tool description",
        "inputSchema": {
          "type": "object",
          "properties": {
            "param1": {
              "type": "string",
              "description": "Parameter description"
            }
          },
          "required": ["param1"]
        }
      }
    ]
  }
}
```

### Tool Call

```json
{
  "jsonrpc": "2.0",
  "id": "call-001",
  "method": "tools/call",
  "params": {
    "name": "original_tool_name",
    "arguments": {
      "param1": "value1"
    }
  }
}
```

### Tool Call Response

```json
{
  "jsonrpc": "2.0",
  "id": "call-001",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Tool execution result"
      }
    ]
  }
}
```

## Lifecycle

1. **Startup**: `registerTools()` loads static tools + creates dynamic MCP tools
2. **User adds server**: Config saved, no tools fetched yet
3. **User clicks "Update"**: `update_mcp_tools` fetches `tools/list`, saves to settings
4. **Agent uses tools**: Agent filters tools by `enabled_tools` map
5. **Tool call**: Dynamic tool routes to correct MCP server via `MCPServer.callTool()`
6. **Shutdown**: `disconnectAll()` kills all CLI processes

## Error Handling

- Connection errors are displayed in VSCode notifications
- Failed servers are skipped during tool creation
- Tool call errors return structured error responses to the AI agent
- CLI processes have a 30-second timeout per request

## Security

- Environment variables are only passed to CLI processes, not stored in logs
- Tool descriptions from untrusted servers should be treated as hints only
- Agent can disable specific tools from untrusted MCP servers
