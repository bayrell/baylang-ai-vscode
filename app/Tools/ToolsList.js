import { existsSync, promises as fs } from "fs";
import path from "path";
import { Tool } from "../Ai/Tool.js";

export class ToolsList extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("list_tools");
		this.setDescription("List all tools available in the tools directory.");
		this.setPrompt("Use this tool to list all tools available in the tools directory.");
		this.settings = settings;
	}
	
	
	/**
	 * Returns true if can use in question
	 */
	canUse(question)
	{
		const tools_folder = path.join(
			this.settings.workspaceFolderPath, "tools"
		);
		try
		{
			return existsSync(tools_folder);
		}
		catch (error)
		{
			return false;
		}
	}
	
	
	/**
	 * Execute
	 */
	async execute()
	{
		/* Get the current working directory */
		const currentDir = this.settings.workspaceFolderPath;
		const toolsDir = path.join(currentDir, "tools");
		
		try
		{
			/* Check if directory exists */
			const stats = await fs.stat(toolsDir);
			if (!stats.isDirectory())
			{
				return "Error: 'tools' is not a directory.";
			}
			
			/* Read directory contents */
			const files = await fs.readdir(toolsDir);
			
			/* Filter only files (not directories) */
			const fileList = [];
			for (const file of files)
			{
				const fullPath = path.join(toolsDir, file);
				const fileStat = await fs.stat(fullPath);
				if (fileStat.isFile())
				{
					fileList.push(file);
				}
			}
			
			if (fileList.length === 0)
			{
				return "No files found in the tools directory.";
			}
			
			/* Build result string */
			let result = `Files in directory: ./tools\n`;
			result += `Total files: ${fileList.length}\n`;
			result += "File list:\n";
			fileList.forEach(file => {
				result += `  - ${file}\n`;
			});
			
			return result;
		}
		catch (error)
		{
			if (error.code === 'ENOENT')
			{
				return `Error: Directory not found at ./tools`;
			}
			return `Error: ${error.message}`;
		}
	}
}