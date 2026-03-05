import path from "path";
import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class RenameFile extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("rename_file");
		this.setDescription("Rename file or folder on disk by path in current project. File path is relative.");
		this.addProps("old_path", "string", "Old file path in project", true);
		this.addProps("new_path", "string", "New file path in project", true);
		this.setPrompt("Rename files or folders in the project or add content to it, use the `rename_file` function.");
		this.settings = settings;
	}
	
	
	/**
	 * Execute tool
	 */
	async execute(params)
	{
		/* Get params */
		const old_file_path = params.old_path;
		const new_file_path = params.new_path;
		if (!old_file_path || typeof old_file_path !== "string")
		{
			throw new Error("File path not found")
		}
		if (!new_file_path || typeof new_file_path !== "string")
		{
			throw new Error("File path not found");
		}
		
		/* Check file path */
		const absolute_old_file_path = resolve(old_file_path, this.settings.workspaceFolderPath);
		const absolute_new_file_path = resolve(new_file_path, this.settings.workspaceFolderPath);
		
		/* Create folder */
		const dir_name = path.dirname(absolute_new_file_path);
		try
		{
			await fs.mkdir(dir_name, { recursive: true });
		}
		catch (error)
		{
			throw new Error("Could not create directory for file at " + dir_name + ". Details: " + error.message);
		}
		
		try
		{
			await fs.rename(absolute_old_file_path, absolute_new_file_path);
		}
		catch (error)
		{
			throw new Error("Could rename file. Details: " + error.message);
		}
		
		return "Success";
	}
}