import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class ListFiles extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("list_file");
		this.setDescription("List files and directories in a given path. Can list recursively.");
		this.addProps("path", "string", "The directory path to list. If not provided, lists current working directory.", false);
		this.addProps("recursive", "boolean", "If true, lists files and directories recursively.", false);
		this.setPrompt("To view the files and directories in a specific location, use the `list_file` function. You can specify a path to list, and optionally use the `recursive` flag to list contents of subdirectories as well.");
		this.settings = settings;
	}
	
	/**
	 * Execute
	 */
	async execute(params)
	{
		/**
		 * Default to current working directory
		   if not provided
		 */
		const relative_dir_path = params.path || "";
		
		/* Ensure boolean type */
		const recursive = params.recursive === true;
		
		/* Get absolute dir path */
		let absolute_dir_path;
		try
		{
			absolute_dir_path = resolve(relative_dir_path, this.settings.workspaceFolderPath);
		}
		catch (error)
		{
			return `Error: Invalid path provided: ${relative_dir_path}. Details: ${error.message}`;
		}

		/* Check if the path exists and is a directory */
		try
		{
			const stats = await fs.stat(absolute_dir_path);
			if (!stats.isDirectory())
			{
				throw new Error(`Path is not a directory: ${relative_dir_path}`);
			}
		}
		catch (error)
		{
			if (error.code === 'ENOENT')
			{
				return `Error: Directory not found at ${relative_dir_path}`;
			}
			return `Error accessing path ${relative_dir_path}. Details: ${error.message}`;
		}

		let file_list = [];
		try
		{
			await readDirRecursive(
				file_list, absolute_dir_path,
				relative_dir_path, recursive
			);
		}
		catch (error)
		{
			return `Error listing directory ${relative_dir_path}. Details: ${error.message}`;
		}
		
		if (file_list.length === 0)
		{
			return "Directory is empty.";
		}
		
		return file_list.join("\n");
	}
}