import path from "path";
import vscode from "vscode";
import { promises as fs } from "fs";
import { removeFirstSlash, removeLastSlash, fileExists, makeHash } from "../lib.js";
import { Agent, createAgent } from "../Ai/Agent.js";
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
        await this.loadLocalAgents();
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
        await this.loadLocalAgents();
        var convert = (agents, global) => agents.map((item) => {
            var agent = new Agent();
            agent.assign(item);
            agent.global = global;
            return agent;
        });
        var agents = [];
        if (this.data.agents)
        {
            agents = agents.concat(convert(this.data.agents, true));
        }
        agents = agents.concat(convert(this.agents, false));
        return agents;
    }
    
    
    /**
     * Load local agents
     */
    async loadLocalAgents()
    {
        /* Read project agents */
        try
        {
            var file_name = path.join(this.workspaceFolderPath, ".vscode", "agents.json");
            var raw = await fs.readFile(file_name, "utf-8");
            this.agents = JSON.parse(raw);
        }
        catch (e)
        {
            this.agents = [];
        }
        
        /* Read custom settings */
        try
        {
            var file_name = path.join(this.getChatFolderPath(), "agents.json");
            var raw = await fs.readFile(file_name, "utf-8");
            var items = JSON.parse(raw);
            for (var i=0; i<items.length; i++)
            {
                var item = items[i];
                var agent = this.agents.find((obj) => obj.name == item.name);
                if (agent)
                {
                    agent.default = {
                        model: agent.model,
                        model_name: agent.model_name,
                    };
                    agent.model = item.model;
                    agent.model_name = item.model_name;
                }
            }
        }
        catch (e)
        {
        }
    }
    
    
    /**
     * Save local agents
     */
    async saveLocalAgents()
    {
        var folder_path = path.join(this.workspaceFolderPath, ".vscode");
        var file_path = path.join(folder_path, "agents.json");
        
        /* Create folder if does not exists */
        if (!await fileExists(folder_path))
        {
            await fs.mkdir(folder_path, { recursive: true });
        }
        
        /* Create chat folder if does not exists */
        var chat_folder_path = this.getChatFolderPath();
        if (!await fileExists(chat_folder_path))
        {
            await fs.mkdir(chat_folder_path, { recursive: true });
        }
        
        /* Write project file */
        var agents = this.agents.map((agent) => {
            var obj = Object.assign({}, agent);
            if (obj.default)
            {
                if (obj.default.model) obj.model = obj.default.model;
                if (obj.default.model_name) obj.model_name = obj.default.model_name;
                delete obj.default;
            }
            return obj;
        });
        await fs.writeFile(file_path, JSON.stringify(agents, null, 2));
        
        /* Write custom file */
        file_path = path.join(this.getChatFolderPath(), "agents.json");
        await fs.writeFile(file_path, JSON.stringify(this.agents, null, 2));
    }
    
    
    /**
     * Get agent by name
     */
    getAgentByName(name, global)
    {
        if (global)
        {
            if (!this.data.agents) return null;
            var agent = this.data.agents.find((item) => item.name == name);
            if (!agent) return null;
            return createAgent(agent, this);
        }
        var agent = this.agents.find((item) => item.name == name);
        if (!agent) return null;
        return createAgent(agent, this);
    }
    
    
    /**
     * Save agent
     */
    async saveAgent(id, item)
    {
        if (item.global)
        {
            if (!this.data.agents) this.data.agents = [];
            var index = this.data.agents.findIndex((agent) => agent.name == id);
            var data = item.getData();
            delete data["default"];
            delete data["global"];
            if (index == -1) this.data.agents.push(data);
            else this.data.agents[index] = data;
            await this.saveData();
        }
        else
        {
            await this.loadLocalAgents();
            var index = this.agents.findIndex((agent) => agent.name == id);
            var data = item.getData();
            delete data["default"];
            delete data["global"];
            if (index == -1)
            {
                data.default = {
                    model: data.model,
                    model_name: data.model_name,
                };
                this.agents.push(data);
            }
            else 
            {
                var agent = this.agents[index];
                agent.name = data.name;
                agent.enable_rules = data.enable_rules;
                agent.model = data.model;
                agent.model_name = data.model_name;
                agent.prompt = data.prompt;
            }
            await this.saveLocalAgents();
        }
    }
    
    
    /**
     * Delete agent
     */
    async deleteAgent(name, global)
    {
        if (global)
        {
            if (!this.data.agents) return;
            
            var index = this.data.agents.findIndex((agent) => agent.name == name);
            if (index != -1) this.data.agents.splice(index, 1);
            await this.saveData();
        }
        else
        {
            var index = this.agents.findIndex((agent) => agent.name == name);
            if (index != -1) this.agents.splice(index, 1);
            await this.saveLocalAgents();
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
        
        files = files.filter(file => file.endsWith(".json"))
            .filter(file => file != "agents.json")
            .filter(file => file != "settings.json")
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
        if (!fileExists(filePath)) return;
        try
        {
            fs.unlink(filePath);
        }
        catch (e){}
    }
}