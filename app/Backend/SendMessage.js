import { Chat, CreateChatEvent } from "../Ai/Chat.js";
import { Question } from "../Ai/Question.js";

export function registerSendMessage(settings, provider)
{
	var registry = provider.registry;
	
	/* Send message */
	registry.register("send_message", async (message) => {
		
		/* Find agent by id */
		var agent = settings.getAgentByName(message.agent, message.global);
		if (!agent)
		{
			return {
				success: false,
				message: "Agent not found",
			}
		}
		
		/* Create question */
		var question = new Question();
		question.agent = agent;
		question.provider = provider;
		question.settings = settings;
		question.folderPath = settings.workspaceFolderPath;
		question.tools = settings.tools;
		question.usage = settings.usage;
		settings.questions.push(question);
		
		/* Find model */
		question.model = settings.getModelByName(
			message.model ? message.model : agent.model
		);
		
		/* Set model name */
		question.model_name = message.model_name ? message.model_name : agent.model_name;
		
		/* Load chat by id */
		question.chat = await settings.loadChatById(message.id);
		if (!question.chat)
		{
			question.chat = new Chat();
			question.chat.id = message.id;
			question.chat.name = message.name;
			provider.sendMessage(new CreateChatEvent(question.chat));
		}
		
		/* Add files */
		var files = JSON.parse(message.files);
		await question.addFiles(files);
		await question.readFiles();
		
		/* Read memory */
		await question.readMemory();
		
		/* Remove chat history */
		if (message.lastMessageId)
		{
			question.user_message = question.removeChatHistory(message.lastMessageId);
		}
		
		/* Send question */
		var send_question = async () => {
			if (message.content && !message.lastMessageId)
			{
				await question.addUserMessage(message.content);
			}
			await question.updateRules();
			await question.initChat();
			await settings.saveChat(question.chat);
			await question.send();
			
			/* Remove question */
			var index = settings.questions.findIndex((item) => item == question);
			settings.questions.splice(index);
		};
		send_question();
		
		/* Returns result */
		return {
			success: true,
		};
	});
}