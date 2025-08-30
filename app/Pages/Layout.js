import Api from "./Api.js";
import Agent from "./Agent/Agent.js";
import ChatModel from "./Chat/ChatModel.js";
import Models from "./Models/Models.js";
import Rules from "./Rules/Rules.js";
import MarkdownIt from 'markdown-it';
import { markRaw } from "vue";

class Layout
{
	constructor()
	{
		this.api = markRaw(new Api(this));
		this.agent_page = new Agent(this);
		this.chat_page = new ChatModel(this);
		this.models_page = new Models(this);
		this.rules_page = new Rules(this);
		this.vscode = markRaw(acquireVsCodeApi());
		this.image_url = "";
		this.page = "chat";
		this.parser = new MarkdownIt({
			html: false,
			linkify: true,
			typographer: true
		});
		this.parser.disable(['code', 'fence']);
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
		if (page == "rules")
		{
			this.rules_page.load();
		}
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
			chat.updateMessage({
				id: message.payload.message_id,
				sender: message.payload.sender,
				content: message.payload.content,
			});
		}
		else if (message.command == "start_chat" || message.command == "step_chat")
		{
			var chat_id = message.payload.chat_id;
			var chat = this.chat_page.findChatById(chat_id);
			if (!chat) return;
			
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
			
			chat.setTyping(false);
			chat.formatMessages(this);
		}
	}
}

export default Layout;