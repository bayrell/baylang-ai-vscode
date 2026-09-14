# MCP Servers — Frontend Technical Specification

## Overview

This document describes the frontend implementation for MCP Servers integration
in the AI Assistant VSCode extension. It covers:

1. **MCP Servers page** — CRUD management of MCP server configurations
2. **Agent page changes** — Tools toggle per agent (`enabled_tools` map)
3. **Layout integration** — Navigation, routing, and page registration

All UI follows the existing project patterns:
- Vue 3 Options API
- CommonJS (no ES modules in frontend)
- BEM CSS naming
- Reusable components: `Crud`, `Button`, `Input`, `Field`, `FieldGroup`

## File Structure

```
app/
├── Pages/
│   ├── Layout.js                ← MODIFIED: add MCPServers page instance
│   ├── Layout.vue               ← MODIFIED: import & render MCPServers component
│   ├── Settings/
│   │   └── Settings.vue         ← MODIFIED: add MCP Servers menu item
│   └── MCPServers/
│       ├── MCPServers.js        ← NEW: model class for MCP Servers CRUD
│       └── MCPServers.vue       ← NEW: Vue component for MCP Servers page
├── Components/
│   └── EnvEditor.vue            ← NEW: reusable key-value pair editor (for env vars)
└── Ai/
    └── Agent.js                 ← ALREADY HAS: enabled_tools property
```

## 1. MCP Servers Page

### 1.1 MCPServers.js — Model Class

File: `app/Pages/MCPServers/MCPServers.js`

This class manages the CRUD operations for MCP servers following the same
pattern as `Models.js` and `Agent.js`.

```javascript
// app/Pages/MCPServers/MCPServers.js

import Crud from "@main/Components/Crud.js";
import Form from "@main/Components/Form/Form.js";
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
```

### 1.2 MCPServers.vue — Vue Component

File: `app/Pages/MCPServers/MCPServers.vue`

```vue
<!-- app/Pages/MCPServers/MCPServers.vue -->

<style lang="scss" scoped>
.mcp_servers_page{
	padding-top: 5px;
	.buttons{
		display: flex;
		gap: 5px;
		margin-bottom: 5px;
	}
}
.mcp_servers_page :deep(.crud .list .page_title){
	margin-top: 10px;
}
.list_item{
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	margin-bottom: 10px;
	padding: 10px;
	background-color: var(--vscode-input-background, white);
	border: 1px solid var(--border-color);
	border-radius: 5px;

	&:last-child{
		margin-bottom: 0px;
	}

	&__info{
		flex: 1;
	}
	&__name{
		font-weight: bold;
		margin-bottom: 4px;
	}
	&__details{
		color: var(--input-color);
		font-size: 12px;
		margin-bottom: 4px;
	}
	&__tools{
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	&__buttons{
		display: flex;
		gap: 5px;
		span{
			cursor: pointer;
		}
	}
}
.tool_badge{
	display: inline-block;
	padding: 2px 6px;
	background-color: var(--vscode-badge-background, #4d4d4d);
	color: var(--vscode-badge-foreground, white);
	border-radius: 3px;
	font-size: 11px;
}
.server_type{
	display: inline-block;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 11px;
	margin-right: 6px;

	&--server{
		background-color: #1a3a1a;
		color: #4ec94e;
	}
	&--cli{
		background-color: #3a2a1a;
		color: #e9a74e;
	}
}
.update_result{
	margin-top: 10px;
	padding: 8px;
	border-radius: 5px;
	text-align: center;
}
.env_editor{
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.env_item{
	display: flex;
	align-items: center;
	gap: 8px;

	&__input{
		flex: 1;
	}
	&__remove{
		cursor: pointer;
		color: #e74c3c;
	}
}
.tools_list{
	margin-top: 5px;
}
.tools_list_title{
	font-weight: bold;
	margin-bottom: 5px;
	font-size: 12px;
}
.tools_list_item{
	display: flex;
	gap: 8px;
	align-items: baseline;
	padding: 4px 0;
	border-bottom: 1px solid var(--border-color);

	&:last-child{
		border-bottom: none;
	}
}
.tools_list_name{
	font-family: monospace;
	font-size: 12px;
}
.tools_list_desc{
	color: var(--input-color);
	font-size: 11px;
}
.args_help{
	font-size: 11px;
	color: var(--input-color);
	margin-top: 4px;
}
</style>

<template>
	<div class="mcp_servers_page page">
		<div
			class="buttons"
			v-show="!model.crud.show_save && !model.crud.show_delete"
		>
			<Button class="back" @click="layout.setPage('settings')">
				Back
			</Button>
			<Button class="success" @click="showAdd()">
				Add Server
			</Button>
			<Button
				class="default"
				@click="updateAllTools"
				:disabled="model.items.length == 0"
			>
				Update All
			</Button>
		</div>

		<Crud :crud="model.crud">
			<template v-slot:list>
				<div class="page_title">
					MCP Servers
				</div>

				<div
					v-for="item in items"
					:key="item.id"
					class="list_item"
				>
					<div class="list_item__info">
						<div class="list_item__name">
							<span
								class="server_type"
								:class="'server_type--' + item.type"
							>
								{{ item.type == "server" ? "HTTP" : "CLI" }}
							</span>
							{{ item.name }}
						</div>
						<div class="list_item__details">
							<template v-if="item.type == 'server'">
								URL: {{ item.url }}
							</template>
							<template v-else>
								Command: {{ item.command }}
								{{ formatArgs(item.args) }}
							</template>
							| Prefix: {{ item.prefix || "(none)" }}
							| Tools: {{ getToolsCount(item) }}
						</div>
						<div class="list_item__tools" v-if="getToolsList(item).length > 0">
							<span
								v-for="tool in getToolsList(item).slice(0, 5)"
								:key="tool.name"
								class="tool_badge"
							>
								{{ tool.name }}
							</span>
							<span
								v-if="getToolsList(item).length > 5"
								class="tool_badge"
							>
								+{{ getToolsList(item).length - 5 }} more
							</span>
						</div>
					</div>
					<div class="list_item__buttons">
						<span @click="showEdit(item.id)">[Edit]</span>
						<span @click="showUpdateTools(item.id)">[Update]</span>
						<span @click="model.crud.showDelete(item.id)">[Delete]</span>
					</div>
				</div>

				<div
					v-if="items.length == 0"
					class="update_result"
				>
					No MCP servers configured. Click "Add Server" to add one.
				</div>
			</template>

			<template v-slot:save_title>
				{{ model.crud.isAdd() ? "Add MCP Server" : "Edit MCP Server" }}
			</template>

			<template v-slot:save_content>
				<Field name="name">
					<div class="label">Name</div>
					<Input
						name="name"
						v-model="model.form.item.name"
						placeholder="My MCP Server"
					/>
				</Field>

				<Field name="type">
					<div class="label">Type</div>
					<Input
						type="select"
						name="type"
						v-model="model.form.item.type"
						:options="type_options"
					/>
				</Field>

				<Field name="prefix">
					<div class="label">Tool Prefix</div>
					<Input
						name="prefix"
						v-model="model.form.item.prefix"
						placeholder="myserver"
					/>
					<div class="args_help">
						Prefix added to tool names: {{ model.form.item.prefix || "..." }}_tool_name
					</div>
				</Field>

				<!-- HTTP server fields -->
				<template v-if="model.form.item.type == 'server'">
					<Field name="url">
						<div class="label">URL</div>
						<Input
							name="url"
							v-model="model.form.item.url"
							placeholder="http://localhost:3000/mcp"
						/>
					</Field>
				</template>

				<!-- CLI server fields -->
				<template v-if="model.form.item.type == 'cli'">
					<Field name="command">
						<div class="label">Command</div>
						<Input
							name="command"
							v-model="model.form.item.command"
							placeholder="npx"
						/>
					</Field>

					<Field name="args">
						<div class="label">Arguments</div>
						<Input
							name="args"
							v-model="model.form.item.args"
							placeholder="-y @modelcontextprotocol/server-filesystem /tmp"
						/>
						<div class="args_help">
							Space-separated arguments
						</div>
					</Field>
				</template>

				<!-- Environment variables -->
				<Field name="env">
					<div class="label">
						Environment Variables
						<Button class="default small" @click="addEnv">
							Add
						</Button>
					</div>
					<div class="env_editor">
						<div
							v-for="(envItem, index) in model.form.item.env"
							:key="index"
							class="env_item"
						>
							<Input
								v-model="envItem.key"
								placeholder="KEY"
								class="env_item__input"
							/>
							<Input
								v-model="envItem.value"
								placeholder="value"
								class="env_item__input"
							/>
							<span
								class="env_item__remove"
								@click="removeEnv(index)"
							>
								[×]
							</span>
						</div>
					</div>
				</Field>

				<!-- Discovered tools list -->
				<div class="tools_list" v-if="model.form.item.tools && model.form.item.tools.length > 0">
					<div class="tools_list_title">
						Discovered Tools ({{ model.form.item.tools.length }})
					</div>
					<div
						v-for="tool in model.form.item.tools"
						:key="tool.name"
						class="tools_list_item"
					>
						<span class="tools_list_name">
							{{ model.form.item.prefix || "" }}{{ model.form.item.prefix ? "_" : "" }}{{ tool.name }}
						</span>
						<span class="tools_list_desc">
							{{ tool.description }}
						</span>
					</div>
				</div>

				<!-- Update result message -->
				<Result
					v-if="update_result.message"
					:result="update_result"
				/>
			</template>

			<template v-slot:delete_message>
				Delete MCP server "{{ model.form.item.name }}"?
			</template>
		</Crud>
	</div>
</template>

<script lang="js">
import Button from "@main/Components/Button.vue";
import Crud from "@main/Components/Crud.vue";
import Input from "@main/Components/Input.vue";
import Field from "@main/Components/Form/Field.vue";
import Result from "@main/Components/Form/Result.vue";

export default {
	name: "MCPServers",
	components: {
		Button,
		Crud,
		Input,
		Field,
		Result,
	},
	data()
	{
		return {
			update_result: {
				code: 0,
				message: "",
			},
		};
	},
	computed: {
		layout()
		{
			return this.$root.layout;
		},
		model()
		{
			return this.layout.mcp_servers_page;
		},
		items()
		{
			var items = this.model.items.slice();
			items.sort((a, b) => a.name.localeCompare(b.name));
			return items;
		},
		type_options()
		{
			return [
				{ key: "server", value: "HTTP/SSE Server" },
				{ key: "cli", value: "CLI (stdio)" },
			];
		},
	},
	mounted()
	{
		this.model.load();
	},
	methods: {
		showAdd()
		{
			this.model.crud.showAdd();
			this.model.form.item.type = "server";
			this.model.form.item.enabled = true;
			this.model.form.item.env = [];
			this.model.form.item.tools = [];
			this.update_result = { code: 0, message: "" };
		},
		showEdit(id)
		{
			var item = this.model.findItemById(id);
			if (!item) return;

			var formData = this.model.prepareFormItem(item);
			this.model.crud.showEdit(id);
			this.model.form.setItem(formData);
			this.update_result = { code: 0, message: "" };
		},
		formatArgs(args)
		{
			if (Array.isArray(args))
			{
				return args.join(" ");
			}
			return args || "";
		},
		getToolsCount(item)
		{
			if (!item.tools) return 0;
			return item.tools.length;
		},
		getToolsList(item)
		{
			return this.model.getToolsList(item);
		},
		addEnv()
		{
			this.model.addEnv();
		},
		removeEnv(index)
		{
			this.model.removeEnv(index);
		},
		async showUpdateTools(id)
		{
			var result = await this.model.updateTools(id);
			this.update_result = {
				code: result.isSuccess() ? 1 : -1,
				message: result.isSuccess()
					? "Tools updated successfully"
					: result.message || "Failed to update tools",
			};
		},
		async updateAllTools()
		{
			var result = await this.model.updateAllTools();
			this.update_result = {
				code: result.isSuccess() ? 1 : -1,
				message: result.isSuccess()
					? "All servers updated"
					: result.message || "Failed to update servers",
			};
		},
	},
}
</script>
```

## 2. Agent Page Changes

### 2.1 Agent.js — Add enabled_tools Management

The `Agent.js` model class needs new methods to manage the `enabled_tools` map:

```javascript
// Add these methods to the Agent class in app/Pages/Agent/Agent.js


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
```

### 2.2 Agent.vue — Tools Toggle Section

Add this section to the Agent.vue form, after the `enable_tools` field,
only shown when `enable_tools == "1"`:

```vue
<!-- Add this inside the save_content template, after the enable_tools Field -->

<Field name="tools_toggle" v-if="model.form.item.enable_tools == '1'">
	<div class="label">Available Tools</div>
	<div class="tools_toggle" v-if="tools_data">
		<!-- Built-in tools -->
		<div class="tools_group">
			<div class="tools_group__title">Built-in Tools</div>
			<div class="tools_group__list">
				<label
					v-for="toolName in tools_data.built_in"
					:key="toolName"
					class="tools_toggle__item"
				>
					<input
						type="checkbox"
						:checked="isToolEnabled(toolName)"
						@change="toggleTool(toolName)"
					/>
					<span class="tools_toggle__name">{{ toolName }}</span>
				</label>
			</div>
		</div>

		<!-- MCP tools by server -->
		<div
			v-for="(serverTools, serverName) in mcpToolsGrouped"
			:key="serverName"
			class="tools_group"
		>
			<div class="tools_group__title">MCP Tools ({{ serverName }})</div>
			<div class="tools_group__list">
				<label
					v-for="tool in serverTools"
					:key="tool.name"
					class="tools_toggle__item"
				>
					<input
						type="checkbox"
						:checked="isToolEnabled(tool.name)"
						@change="toggleTool(tool.name)"
					/>
					<span class="tools_toggle__name">{{ tool.name }}</span>
					<span class="tools_toggle__desc">{{ tool.description }}</span>
				</label>
			</div>
		</div>

		<!-- Quick actions -->
		<div class="tools_toggle__actions">
			<Button class="default small" @click="enableAllTools">
				Enable All
			</Button>
			<Button class="default small" @click="disableAllTools">
				Disable All
			</Button>
		</div>
	</div>
</Field>
```

Add these styles to Agent.vue:

```scss
/* Add to Agent.vue styles */

.tools_toggle{
	margin-top: 5px;
}
.tools_group{
	margin-bottom: 10px;

	&__title{
		font-weight: bold;
		margin-bottom: 5px;
		font-size: 12px;
		color: var(--input-color);
	}
	&__list{
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
}
.tools_toggle__item{
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 4px 8px;
	cursor: pointer;
	border-radius: 3px;

	&:hover{
		background-color: var(--vscode-list-hoverBackground, rgba(0, 0, 0, 0.1));
	}

	input[type="checkbox"]{
		margin: 0;
	}
}
.tools_toggle__name{
	font-family: monospace;
	font-size: 12px;
}
.tools_toggle__desc{
	color: var(--input-color);
	font-size: 11px;
	margin-left: auto;
}
.tools_toggle__actions{
	display: flex;
	gap: 5px;
	margin-top: 10px;
}
```

Add these methods to Agent.vue script:

```javascript
// Add to Agent.vue methods

async loadToolsData()
{
	this.tools_data = await this.model.loadAvailableTools();
},
isToolEnabled(toolName)
{
	return this.model.isToolEnabled(toolName);
},
toggleTool(toolName)
{
	this.model.toggleTool(toolName);
},
enableAllTools()
{
	if (!this.tools_data) return;
	var allTools = [
		...this.tools_data.built_in,
		...this.tools_data.mcp.map((t) => t.name),
	];
	this.model.enableAllTools(allTools);
},
disableAllTools()
{
	if (!this.tools_data) return;
	var allTools = [
		...this.tools_data.built_in,
		...this.tools_data.mcp.map((t) => t.name),
	];
	this.model.disableAllTools(allTools);
},
```

Add to Agent.vue data:

```javascript
data()
{
	return {
		reload_result: new Result(),
		tools_data: null,
	};
},
```

Add computed property for MCP tools grouped by server:

```javascript
computed: {
	// ... existing computed properties

	mcpToolsGrouped()
	{
		if (!this.tools_data || !this.tools_data.mcp) return {};

		var grouped = {};
		for (var i = 0; i < this.tools_data.mcp.length; i++)
		{
			var tool = this.tools_data.mcp[i];
			var serverName = tool.server_name || "Unknown";
			if (!grouped[serverName]) grouped[serverName] = [];
			grouped[serverName].push(tool);
		}
		return grouped;
	},
},
```

## 3. Layout Integration

### 3.1 Layout.js — Register MCP Servers Page

```javascript
// Add to app/Pages/Layout.js imports:

import MCPServers from "./MCPServers/MCPServers.js";


// Add to Layout constructor:

this.mcp_servers_page = new MCPServers(this);


// Add to setPage() method:

else if (page == "mcp_servers") this.current_page = this.mcp_servers_page;
```

### 3.2 Layout.vue — Register MCP Servers Component

```javascript
// Add to Layout.vue imports:

import MCPServers from "./MCPServers/MCPServers.vue";


// Add to components:

MCPServers,


// Add to template:

<MCPServers v-show="layout.page == 'mcp_servers'" />
```

### 3.3 Settings.vue — Add Menu Item

```vue
<!-- Add this settings_item after Memory and before Usage -->

<div class="settings_item" @click="layout.setPage('mcp_servers')">
	<div class="info">
		<div class="title">MCP Servers</div>
		<div class="description">
			Manage Model Context Protocol servers and tools
		</div>
	</div>
	<div class="action">Configure</div>
</div>
```

## 4. Backend Commands (Already Implemented)

The following commands are already registered in `CommandRegistry.js`:

| Command | Payload | Response |
|---------|---------|----------|
| `load_mcp_servers` | none | `{ items: [...] }` |
| `save_mcp_server` | `{ id, item }` | `{ success: true }` |
| `delete_mcp_server` | `id` | `{ success: true }` |
| `update_mcp_tools` | `serverId` | `{ tools: [...] }` |
| `update_all_mcp_tools` | none | `{ items: { [id]: {...} } }` |
| `run_mcp_tool` | `{ serverId, toolName, args }` | `{ data: result }` |

## 5. Data Flow

### 5.1 Loading MCP Servers

```
User opens MCP Servers page
        │
        ▼
MCPServers.load()
        │
        ▼
api.call("load_mcp_servers")
        │
        ▼
Backend: MCPServerManager.loadServers()
        │
        ▼
Response: { items: [server1, server2, ...] }
        │
        ▼
MCPServers.items = items
        │
        ▼
Vue renders list of servers
```

### 5.2 Adding/Editing MCP Server

```
User clicks "Add Server" or "Edit"
        │
        ▼
Crud.showAdd() / Crud.showEdit(id)
        │
        ▼
Form displays with server fields
        │
        ▼
User fills in fields (name, type, url/command, prefix, env)
        │
        ▼
User clicks "Add" or "Save"
        │
        ▼
MCPServers.add() / MCPServers.save()
        │
        ▼
api.call("save_mcp_server", { id, item })
        │
        ▼
Backend saves to settings.json
        │
        ▼
Frontend updates local items array
```

### 5.3 Updating Tools

```
User clicks "[Update]" on a server
        │
        ▼
MCPServers.updateTools(id)
        │
        ▼
api.call("update_mcp_tools", serverId)
        │
        ▼
Backend: MCPServerManager.updateServerTools(id)
        │
        ├─ MCPServer.connect()
        ├─ MCPServer.fetchTools() → tools/list
        ├─ MCPServerManager.saveServers()
        ├─ registerTools(settings) → recreate dynamic tools
        │
        ▼
Response: { tools: [...] }
        │
        ▼
Frontend updates server.tools
        │
        ▼
Vue re-renders tool badges
```

### 5.4 Agent Tools Toggle

```
User opens Agent editor with enable_tools = "1"
        │
        ▼
Agent.vue loads tools_data
        │
        ▼
api.call("load_mcp_servers") → get all MCP tools
        │
        ▼
Vue renders checkboxes for all tools
        │
        ▼
User toggles checkboxes
        │
        ▼
Agent.model.form.item.enabled_tools updated
        │
        ▼
Saved with agent via "save_agent" command
```

## 6. Form Field Specifications

### 6.1 Server Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | input | Yes | Display name for the server |
| `type` | select | Yes | "server" (HTTP) or "cli" (stdio) |
| `prefix` | input | No | Prefix for tool names |
| `url` | input | Yes* | HTTP URL (when type = "server") |
| `command` | input | Yes* | CLI command (when type = "cli") |
| `args` | input | No | Space-separated arguments (when type = "cli") |
| `env` | key-value | No | Environment variables array |

### 6.2 Agent Form Fields (Additions)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tools_toggle` | checkbox group | No | Only shown when enable_tools = "1" |

## 7. Error Handling

### 7.1 Connection Errors

When updating tools fails:
- `update_result` displays error message
- Server remains in list with existing tools
- User can retry by clicking "Update" again

### 7.2 Validation

- Server name is required
- URL is required for HTTP servers
- Command is required for CLI servers
- Duplicate server IDs are prevented by auto-generation

### 7.3 Empty States

- Empty MCP servers list: Shows "No MCP servers configured" message
- No tools discovered: Shows "Tools: 0" in server details
- No MCP tools available: Agent tools toggle shows only built-in tools

## 8. Implementation Checklist

- [ ] Create `app/Pages/MCPServers/MCPServers.js`
- [ ] Create `app/Pages/MCPServers/MCPServers.vue`
- [ ] Modify `app/Pages/Layout.js` — import and register MCPServers
- [ ] Modify `app/Pages/Layout.vue` — import and render MCPServers
- [ ] Modify `app/Pages/Settings/Settings.vue` — add MCP Servers menu item
- [ ] Modify `app/Pages/Agent/Agent.js` — add tools management methods
- [ ] Modify `app/Pages/Agent/Agent.vue` — add tools toggle UI
- [ ] Test CRUD operations for MCP servers
- [ ] Test tools update functionality
- [ ] Test agent tools toggle persistence
