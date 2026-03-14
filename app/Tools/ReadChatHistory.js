import path from "path";
import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class ReadChatHistory extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("read_chat_history");
		this.setDescription("Read multiple chat history files");
		this.addProps({
			key: "file_names",
			type: "array",
			description: "Array of file names to read from history",
			required: true,
			items: {
				type: "string"
			}
		});
		this.setPrompt("Use `read_chat_history` tool to read multiple chat history files at once. Provide an array of file names to read.");
		this.settings = settings;
		this.historyFolder = ".vscode/history";
	}

	/**
	 * Execute read multiple chat history files
	 */
	async execute(params)
	{
		const file_names = params ? params.file_names : [];

		if (!file_names || !Array.isArray(file_names) || file_names.length === 0)
		{
			throw new Error("file_names parameter is required and must be a non-empty array");
		}

		const history_path = path.join(this.settings.workspaceFolderPath, this.historyFolder);

		try
		{
			// Create history folder if it doesn't exist
			await fs.mkdir(history_path, { recursive: true });

			const results = [];
			for (const file_name of file_names)
			{
				const file_path = path.join(history_path, file_name);

				try
				{
					// Check if file exists
					await fs.access(file_path, fs.constants.F_OK);

					// Read file content
					const content = await fs.readFile(file_path, "utf8");
					
					var arr = [];
					arr.push("Filename: " + file_name);
					arr.push(content);
					results.push(arr.join("\n"));
				}
				catch
				{
				}
			}

			return results.join("\n\n");
		}
		catch (error)
		{
			throw new Error(`Failed to read chat history files: ${error.message}`);
		}
	}

	/**
	 * Returns arguments text
	 */
	getArgumentsText(params)
	{
		const file_names = params ? params.file_names : [];

		if (file_names && file_names.length > 0)
		{
			const names = file_names.slice(0, 3).join(", ");
			return `([${names}${file_names.length > 3 ? "..." : ""}])`;
		}
		return "([])";
	}
}