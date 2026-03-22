import path from "path";
import vscode from "vscode";
import { promises as fs } from "fs";
import { removeFirstSlash, removeLastSlash } from "../lib.js";
import { fileExists, makeHash, makeFilePath } from "../api.js";
import { Agent } from "../Ai/Agent.js";
import { Chat } from "../Ai/Chat.js";
import { createModel } from "../Ai/Model.js";
import { Rule } from "../Ai/Rule.js";

export class Settings
{
	constructor(globalStorageUri)
	{
		this.folderPath = globalStorageUri.path;
		this.filePath = path.join(this.folderPath, "settings.json");
		this.data = {};
		this.agents = [];
		this.tools = [];
		this.workspaceFolderPath = "";
		this.workspaceFolderHash = "";
		if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
		{
			var folder = vscode.workspace.workspaceFolders[0];
			this.workspaceFolderPath = "/" + removeFirstSlash(removeLastSlash(folder.uri.fsPath));
			this.workspaceFolderHash = makeHash(this.workspaceFolderPath);
		}
	}
	
	
	/**
	 * Load data
	 */
	async loadData()
	{
		/* Load global settings */
		try
		{
			var raw = await fs.readFile(this.filePath, "utf-8");
			this.data = JSON.parse(raw);
		}
		catch (e)
		{
			this.data = {};
		}
		
		/* Load agents */
		await this.loadAgents();
	}
	
	
	/**
	 * Save data
	 */
	async saveData()
	{
		/* Create folder if does not exists */
		if (!await fileExists(this.folderPath))
		{
			await fs.mkdir(this.folderPath, { recursive: true });
		}
		
		/* Write file */
		await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
	}
	
	
	/**
	 * Load agents
	 */
	async loadAgents()
	{
		this.agents = [];
		
		/* Load global agents */
		await this.loadAgentsFromPath(path.join(this.folderPath, "agents"));
		
		/* Load local agents */
		await this.loadAgentsFromPath(
			path.join(this.workspaceFolderPath, ".vscode", "agents"),
			path.join(this.getChatFolderPath(), "agents.json")
		);
		
		return this.agents;
	}
	
	
	/**
	 * Load agents modificators
	 */
	async loadAgentsModificators(agentFile)
	{
		try
		{
			var raw = await fs.readFile(agentFile, "utf-8");
			return JSON.parse(raw);
		}
		catch(e)
		{
		}
		return [];
	}
	
	
	/**
	 * Save agents modificators
	 */
	async saveAgentsModificators(agentFile, agents)
	{
		try
		{
			var data = JSON.stringify(agents, null, 2);
			
			/* Save file */
			await makeFilePath(agentFile);
			await fs.writeFile(agentFile, data);
		}
		catch(e)
		{
		}
	}
	
	
	/**
	 * Load agents by path
	 */
	async loadAgentsFromPath(folderPath, agentFile)
	{
		if (agentFile == undefined) agentFile = null;
		var isGlobal = agentFile == null;
		
		/* Agents local modificators */
		var agents = [];
		try
		{
			var raw = await fs.readFile(agentFile, "utf-8");
			agents = JSON.parse(raw);
		}
		catch(e)
		{
		}
		
		/* Get agents list */
		var files = [];
		try
		{
			files = await fs.readdir(folderPath);
		}
		catch (e)
		{
			
		}
		
		/* Read files */
		files = files.filter((file) => file.endsWith(".json"));
		for (var i=0; i<files.length; i++)
		{
			var fileName = files[i];
			var filePath = path.join(folderPath, fileName);
			try
			{
				var raw = await fs.readFile(filePath);
				var content = JSON.parse(raw);
				var agent = new Agent();
				agent.assign(content);
				agent.setFileName(filePath);
				agent.global = isGlobal;
				this.agents.push(agent);
			}
			catch (e)
			{
			}
		}
		
		/* Add modificators */
		if (!isGlobal)
		{
			for (var i=0; i<agents.length; i++)
			{
				var data = agents[i];
				var agent = this.getAgentByName(data.name, false);
				if (agent)
				{
					agent.assign({
						model: data.model,
						model_name: data.model_name,
					});
				}
			}
		}
	}
	
	
	/**
	 * Get agent by name
	 */
	getAgentByName(name, global)
	{
		var agent = this.agents.find((item) => item.name == name && item.global == global);
		return agent;
	}
	
	
	/**
	 * Filter agent modificators
	 */
	filterAgentModificators(agents)
	{
		for (var i=agents.length - 1; i>=0; i--)
		{
			var agent = agents[i];
			var agent_name = agent.name;
			var find = this.getAgentByName(agent_name, false);
			if (!find)
			{
				agents.splice(i, 1);
			}
		}
		return agents;
	}
	
	
	/**
	 * Save agent
	 */
	async saveAgent(pk, data)
	{
		var agents = [];
		var agentFile = path.join(this.getChatFolderPath(), "agents.json");
		
		/* Find agent */
		var agent = pk ? this.getAgentByName(pk.name, pk.global) : null;
		
		/* Create agent */
		if (!agent)
		{
			agent = new Agent();
			agent.assign(data);
			
			/* Get file name */
			var folderPath = "";
			var fileName = data.name.replace(" ", "");
			if (data.global) folderPath = path.join(this.folderPath, "agents");
			else folderPath = path.join(this.workspaceFolderPath, ".vscode", "agents");
			fileName = path.join(folderPath, fileName + ".json");
			
			if (await fileExists(fileName))
			{
				fileName = path.join(folderPath, (new Date()).getTime() + ".json");
			}
			
			/* Set file name */
			await fs.mkdir(folderPath, { recursive: true });
			agent.setFileName(fileName);
		}
		
		/* Agents local modificators */
		if (!agent.global) agents = await this.loadAgentsModificators(agentFile);
		
		/* Save file data */
		var fileName = agent.file_name;
		try
		{
			agent.assign(data);
			var data = agent.getData();
			if (!agent.global)
			{
				delete data.model;
				delete data.model_name;
			}
			
			/* Convert data */
			var raw = JSON.stringify(data, null, 2);
			await fs.writeFile(fileName, raw);
		}
		catch (e)
		{
		}
		
		/* Save agents */
		if (!agent.global)
		{
			var item = agents.find((item) => item.name == agent.name);
			if (!item)
			{
				item = { name: agent.name, global: agent.global };
				agents.push(item);
			}
			item.model = agent.model;
			item.model_name = agent.model_name;
			this.filterAgentModificators(agents);
			await this.saveAgentsModificators(agentFile, agents);
		}
	}
	
	
	/**
	 * Delete agent
	 */
	async deleteAgent(pk)
	{
		/* Find agent */
		var index = this.agents.findIndex((item) => item.name == pk.name &&
			item.global == pk.global);
		if (index == -1) return;
		
		/* Remove agent */
		var agent = this.agents[index];
		this.agents.splice(index, 1);
		
		/* Remove file */
		try
		{
			await fs.unlink(agent.file_name);
		}
		catch(e)
		{
		}
		
		/* Remove modificators */
		if (!pk.global)
		{
			var agentFile = path.join(this.getChatFolderPath(), "agents.json");
			var agents = await this.loadAgentsModificators(agentFile);
			var agentIndex = agents.find((item) => item.name == pk.name);
			if (agentIndex >= 0) agents.splice(agentIndex, 1);
			this.filterAgentModificators(agents);
			await this.saveAgentsModificators(agentFile, agents);
		}
	}
	
	
	/**
	 * Load models
	 */
	loadModels()
	{
		return this.data.models ? this.data.models : []
	}
	
	
	/**
	 * Returns model by name
	 */
	getModelByName(name)
	{
		if (!this.data.models) return null;
		var model = this.data.models.find((item) => item.name == name);
		if (!model) return null;
		return createModel(model);
	}
	
	
	/**
	 * Save model
	 */
	async saveModel(id, item)
	{
		if (!this.data.models) this.data.models = [];
		var index = this.data.models.findIndex((agent) => agent.name == id);
		if (index == -1) this.data.models.push(item);
		else this.data.models[index] = item;
		await this.saveData();
	}
	
	
	/**
	 * Delete model
	 */
	async deleteModel(name)
	{
		if (!this.data.models) return;
		
		var index = this.data.models.findIndex((model) => model.name == name);
		if (index != -1) this.data.models.splice(index, 1);
		await this.saveData();
	}
	
	
	/**
	 * Load rules
	 */
	async loadRules()
	{
		if (!await fileExists(this.workspaceFolderPath))
		{
			return;
		}
		
		var folderPath = path.join(this.workspaceFolderPath, ".vscode", "rules");
		var files = [];
		try
		{
			files = await fs.readdir(folderPath);
		}
		catch (e){}
		
		files = files.filter(file => file.endsWith(".rule"))
			.map(file => path.basename(file, ".rule"));
		files.sort();
		files = await Promise.all(files.map((file_name) => this.loadRule(file_name)));
		files = files.filter(file => file != null);
		return files;
	}
	
	
	/**
	 * Load rule
	 */
	async loadRule(rule_name)
	{
		if (!await fileExists(this.workspaceFolderPath))
		{
			return;
		}
		
		var folderPath = path.join(this.workspaceFolderPath, ".vscode", "rules");
		var filePath = path.join(folderPath, rule_name + ".rule");
		var content = "";
		try
		{
			content = await fs.readFile(filePath, "utf-8");
		}
		catch (e)
		{
			return null;
		}
		
		var rule = new Rule();
		rule.name = rule_name;
		rule.parseContent(content);
		return rule;
	}
	
	
	/**
	 * Save rule
	 */
	async saveRule(item)
	{
		if (!await fileExists(this.workspaceFolderPath))
		{
			return;
		}
		
		var folderPath = path.join(this.workspaceFolderPath, ".vscode", "rules");
		var filePath = path.join(folderPath, item.name + ".rule");
		if (!await fileExists(folderPath))
		{
			await fs.mkdir(folderPath, { recursive: true });
		}
		
		await fs.writeFile(filePath, item.getContent());
	}
	
	
	/**
	 * Delete rule
	 */
	async deleteRule(rule_name)
	{
		if (!await fileExists(this.workspaceFolderPath))
		{
			return;
		}
		
		var folderPath = path.join(this.workspaceFolderPath, ".vscode", "rules");
		var filePath = path.join(folderPath, rule_name + ".rule");
		if (!fileExists(filePath)) return;
		try
		{
			fs.unlink(filePath);
		}
		catch (e){}
	}
	
	
	/**
	 * Returns chat folder
	 */
	getChatFolderPath()
	{
		if (this.workspaceFolderHash == "") return path.join(this.folderPath, "chat");
		return path.join(this.folderPath, "chat", this.workspaceFolderHash);
	}
	
	
	/**
	 * Load chat
	 */
	async loadChat()
	{
		var folderPath = this.getChatFolderPath();
		var files = [];
		try
		{
			files = await fs.readdir(folderPath);
		}
		catch (e){}
		
		const isCorrect = (file_name) => {
			const file_info = path.parse(file_name);
			const base_name = file_info.name;
			if (!/^\d+$/.test(base_name)) return false;
			if (file_info.ext != ".json") return false;
			return true;
		};
		files = files.filter(file => file.endsWith(".json"))
			.filter(isCorrect)
			.map(file => path.basename(file, ".json"));
		files.sort();
		files = await Promise.all(files.map((file_name) => this.loadChatById(file_name)));
		files = files.filter(file => file != null);
		return files;
	}
	
	
	/**
	 * Load chat by id
	 */
	async loadChatById(chat_id)
	{
		var chat = null;
		var data = null;
		var folderPath = this.getChatFolderPath();
		var filePath = path.join(folderPath, chat_id + ".json");
		try
		{
			const raw = await fs.readFile(filePath, "utf-8");
			data = JSON.parse(raw);
		}
		catch (e)
		{
			return null;
		}
		
		if (data != null)
		{
			chat = new Chat();
			chat.assign(data);
		}
		return chat;
	}
	
	
	/**
	 * Save chat
	 */
	async saveChat(chat)
	{
		var folderPath = this.getChatFolderPath();
		if (!await fileExists(folderPath))
		{
			await fs.mkdir(folderPath, { recursive: true });
		}
		
		var filePath = path.join(folderPath, chat.id + ".json");
		await fs.writeFile(filePath, JSON.stringify(chat.getData(), null, 2));
	}
	
	
	/**
	 * Delete chat
	 */
	async deleteChat(chat_id)
	{
		var folderPath = this.getChatFolderPath();
		var filePath = path.join(folderPath, chat_id + ".json");
		if (!await fileExists(filePath)) return;
		try
		{
			var newPath = path.join(folderPath, "archive", chat_id + ".json");
			await makeFilePath(newPath);
			
			/* Move file */
			await fs.rename(filePath, newPath);
		}
		catch (e){}
	}
}