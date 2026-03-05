import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class ReadFile extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("read_file");
		this.setDescription("Read file from disk by path in current project. File path is relative.");
		this.addProps("path", "string", "File path in project", true);
		this.setPrompt("To read files in the project, use the `read_file` function.");
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments text
	 */
	getArgumentsText(params)
	{
		const file_path = params ? params.path : "";
		return "(" + JSON.stringify(file_path) + ")";
	}
	
	
	/**
	 * Execute tool
	 */
	async execute(params)
	{
		/* Get params */
		const file_path = params ? params.path : "";
		if (!file_path)
		{
			throw new Error("File path not found")
		}
		if (typeof file_path !== "string")
		{
			throw new Error("File path not found");
		}
		
		/* Check file path */
		const absolute_file_path = resolve(file_path, this.settings.workspaceFolderPath)
		
		/* Read file */
		var content = "";
		try
		{
			content = await fs.readFile(absolute_file_path, { encoding: 'utf8' });
		}
		catch (error)
		{
			throw new Error("Read file error: " + error.message);
		}
		
		/* Returns file content */
		return content;
	}
}