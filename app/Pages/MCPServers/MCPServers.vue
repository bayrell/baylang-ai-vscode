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
.mcp_servers_page :deep(.result){
	margin-bottom: 10px;
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
				
				<!-- Update result message -->
				<Result
					v-if="update_result.message"
					:result="update_result"
				/>
				
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
		update_result()
		{
			return this.model.update_result;
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
		},
		showEdit(id)
		{
			var item = this.model.findItemById(id);
			if (!item) return;

			var formData = this.model.prepareFormItem(item);
			this.model.crud.showEdit(id);
			this.model.form.setItem(formData);
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
			await this.model.updateTools(id);
		},
		async updateAllTools()
		{
			await this.model.updateAllTools();
		},
	},
}
</script>