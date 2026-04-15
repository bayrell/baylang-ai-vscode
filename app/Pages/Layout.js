import Api from "./Api.js";
import Agent from "./Agent/Agent.js";
import ChatModel from "./Chat/ChatModel.js";
import Models from "./Models/Models.js";
import Rules from "./Rules/Rules.js";
import Memory from "./Memory/Memory.js";
import MarkdownIt from 'markdown-it';
import { markRaw } from "vue";
import { Usage } from "./Usage/Usage.js";

class Layout
{
	constructor()
	{
		this.api = markRaw(new Api(this));
		this.agent_page = new Agent(this);
		this.chat_page = new ChatModel(this);
		this.models_page = new Models(this);
		this.rules_page = new Rules(this);
		this.memory_page = new Memory(this);
		this.usage_page = new Usage(this);
		this.current_page = null;
		this.vscode = markRaw(acquireVsCodeApi());
		this.image_url = "";
		this.page = "chat";
		this.parser = new MarkdownIt({
			html: false,
			linkify: true,
			typographer: true
		});
		this.parser.disable(["code", "fence"]);
	}
	
	
	/**
	 * Bind
	 */
	bind()
	{
		/* Api */
		this.api.bind();
		this.api.addListener(this.onMessage.bind(this));
		
		/* Chat page */
		this.chat_page.bind();
		this.current_page = this.chat_page;
	}
	
	
	/**
	 * Set image url
	 */
	setImageUrl(url)
	{
		this.image_url = url;
	}
	
	
	/**
	 * Returns image path
	 */
	getImage(path)
	{
		return this.image_url + "/" + path;
	}
	
	
	/**
	 * Set page
	 */
	setPage(page)
	{
		this.page = page;
		if (page == "agent") this.current_page = this.agent_page;
		else if (page == "chat") this.current_page = this.chat_page;
		else if (page == "models") this.current_page = this.models_page;
		else if (page == "rules") this.current_page = this.rules_page;
		else if (page == "memory") this.current_page = this.memory_page;
		else if (page == "usage") this.current_page = this.usage_page;
		else if (page == "settings") this.current_page = null;
		if (this.current_page) this.current_page.open();
	}
	
	
	/**
	 * Run tool
	 */
	async runTool(name, data)
	{
		var agent_id = this.chat_page.current_agent_id;
		var agent = this.agent_page.items[agent_id];
		if (!agent) return null;
		
		var result = await this.api.call(
			"run_tool", {
				name: name,
				data: data,
				agent: agent.name,
				global: agent.global
			}
		);
		if (result.code != 1)
		{
			return "Error: " + result.message;
		}
		return result.data.content;
	}
	
	
	/**
	 * On message
	 */
	onMessage(event)
	{
		var message = event.data;
		if (!message.command) return;
		if (message.command == "show_page")
		{
			this.page = message.page;
		}
		else if (message.command == "update_chat")
		{
			var chat_id = message.payload.chat_id;
			var chat = this.chat_page.findChatById(chat_id);
			if (!chat) return;
			
			chat.setTyping(false);
			chat.updateMessage(Object.assign(message.payload.data, {
				id: message.payload.message_id,
				sender: message.payload.sender,
			}));
		}
		else if (message.command == "start_chat" || message.command == "step_chat")
		{
			var chat_id = message.payload.chat_id;
			var chat = this.chat_page.findChatById(chat_id);
			if (!chat) return;
			
			chat.setWork(true);
			chat.setTyping(true);
		}
		else if (message.command == "update_title")
		{
			var chat_id = message.payload.chat_id;
			var chat = this.chat_page.findChatById(chat_id);
			if (!chat) return;
			
			chat.title = message.payload.chat_name;
		}
		else if (message.command == "error_chat" || message.command == "end_chat")
		{
			var chat_id = message.payload.chat_id;
			var chat = this.chat_page.findChatById(chat_id);
			if (!chat) return;
			
			if (message.command == "end_chat") chat.setWork(false);
			chat.setTyping(false);
			chat.formatMessages(this);
		}
	}
}

export default Layout;
