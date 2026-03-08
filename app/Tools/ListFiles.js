import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve, readDirRecursive } from "./Helper.js";

export class ListFiles extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("list_file");
		this.setDescription("List files and directories in a given path. Can list recursively.");
		this.addProps({
			key: "path",
			type: "string",
			description: "The directory path to list. If not provided, lists current working directory.",
			required: true,
		})
		this.addProps({
			key: "recursive",
			type: "boolean",
			description: "If true, lists files and directories recursively.",
			required: false,
		})
		this.setPrompt("To view the files and directories in a specific location, use the `list_file` function. You can specify a path to list, and optionally use the `recursive` flag to list contents of subdirectories as well.");
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments text
	 */
	getArgumentsText(params)
	{
		let relative_dir_path = params ? params.path : "";
		if (!relative_dir_path) relative_dir_path = "";
		return "(" + JSON.stringify(relative_dir_path) + ")";
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
		let relative_dir_path = params ? params.path : "";
		if (!relative_dir_path) relative_dir_path = "";
		
		/* Ensure boolean type */
		const recursive = params ? params.recursive === true : false;
		
		/* Get absolute dir path */
		let absolute_dir_path;
		try
		{
			absolute_dir_path = resolve(relative_dir_path, this.settings.workspaceFolderPath);
		}
		catch (error)
		{
			throw new Error(error.message);
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
				throw new Error(`Error: Directory not found at ${relative_dir_path}`);
			}
			throw new Error(`Error accessing path ${relative_dir_path}. Details: ${error.message}`);
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
			throw new Error(`Error listing directory ${relative_dir_path}. Details: ${error.message}`);
		}
		
		if (file_list.length === 0)
		{
			return "Directory is empty.";
		}
		
		return file_list.join("\n");
	}
}