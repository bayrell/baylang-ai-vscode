import path from "path";
import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class ChatHistory extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("chat_history");
		this.setDescription("Read and save chat history");
		this.addProps({
			key: "action",
			type: "string",
			description: "Action to perform: 'save', 'read', 'list', 'delete'",
			required: true,
		});
		this.addProps({
			key: "file_name",
			type: "string",
			description: "File name for history operations",
			required: false,
		});
		this.addProps({
			key: "content",
			type: "string",
			description: "Chat content to save",
			required: false,
		});
		this.setPrompt("Use `chat_history` tool to save, read, list, or delete chat history files. Save history in yyyy-mm-dd format. Append new chat. If dialog is long save and update history.");
		this.settings = settings;
		this.historyFolder = ".vscode/history";
	}


	/**
	 * Execute chat history operation
	 */
	async execute(params)
	{
		const action = params ? params.action : "";
		const file_name = params ? params.file_name : "";
		const content = params ? params.content : "";

		if (!action)
		{
			throw new Error("Action parameter is required (save, read, list, delete)");
		}

		const history_path = path.join(this.settings.workspaceFolderPath, this.historyFolder);

		switch (action)
		{
			case "save":
				if (!file_name)
				{
					throw new Error("file_name is required for save action");
				}
				if (!content)
				{
					throw new Error("content is required for save action");
				}
				return await this.saveChat(history_path, file_name, content);

			case "read":
				if (!file_name)
				{
					throw new Error("file_name is required for read action");
				}
				return await this.readChat(history_path, file_name);

			case "list":
				return await this.listChats(history_path);

			case "delete":
				if (!file_name)
				{
					throw new Error("file_name is required for delete action");
				}
				return await this.deleteChat(history_path, file_name);

			default:
				throw new Error(`Unknown action: ${action}. Supported actions: save, read, list, delete`);
		}
	}


	/**
	 * Save chat to history file
	 */
	async saveChat(history_path, file_name, content)
	{
		try
		{
			// Create history folder if it doesn't exist
			await fs.mkdir(history_path, { recursive: true });

			// Save to file
			const file_path = path.join(history_path, `${file_name}`);
			await fs.writeFile(file_path, content, "utf8");

			return {
				success: true,
				message: `Chat ${file_name} saved to history`,
				path: file_path,
			};
		}
		catch (error)
		{
			throw new Error(`Failed to save chat history: ${error.message}`);
		}
	}


	/**
	 * Read chat from history file
	 */
	async readChat(history_path, file_name)
	{
		try
		{
			const file_path = path.join(history_path, `${file_name}`);

			// Check if file exists
			try
			{
				await fs.access(file_path, fs.constants.F_OK);
			}
			catch
			{
				return {
					success: false,
					message: `Chat history not found for file: ${file_name}`,
				};
			}

			const content = await fs.readFile(file_path, "utf8");

			return {
				success: true,
				content: content,
				path: file_path,
			};
		}
		catch (error)
		{
			throw new Error(`Failed to read chat history: ${error.message}`);
		}
	}


	/**
	 * List all chat history files
	 */
	async listChats(history_path)
	{
		try
		{
			// Create history folder if it doesn't exist
			await fs.mkdir(history_path, { recursive: true });

			const chat_files = await fs.readdir(history_path);

			const chats = [];
			for (const file of chat_files)
			{
				const file_path = path.join(history_path, file);
				const stats = await fs.stat(file_path);
				chats.push({
					file_name: file,
					path: file_path,
					size: stats.size,
					modified: stats.mtime,
				});
			}

			return {
				success: true,
				chats: chats,
				count: chats.length,
			};
		}
		catch (error)
		{
			throw new Error(`Failed to list chat history: ${error.message}`);
		}
	}


	/**
	 * Delete chat from history
	 */
	async deleteChat(history_path, file_name)
	{
		try
		{
			const file_path = path.join(history_path, `${file_name}`);

			// Check if file exists
			try
			{
				await fs.access(file_path, fs.constants.F_OK);
			}
			catch
			{
				return {
					success: false,
					message: `Chat history not found for file: ${file_name}`,
				};
			}

			await fs.unlink(file_path);

			return {
				success: true,
				message: `Chat ${file_name} deleted from history`,
			};
		}
		catch (error)
		{
			throw new Error(`Failed to delete chat history: ${error.message}`);
		}
	}


	/**
	 * Returns arguments text
	 */
	getArgumentsText(params)
	{
		const action = params ? params.action : "";
		const file_name = params ? params.file_name : "";

		if (file_name)
		{
			return `(${action}, ${file_name})`;
		}
		return `(${action})`;
	}
}
