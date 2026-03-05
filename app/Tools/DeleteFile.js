import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class DeleteFile extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("delete_file");
		this.setDescription("Delete a file from the disk by its path within the current project. The file path is relative.");
		this.addProps("path", "string", "File path in project to delete", true);
		this.setPrompt("To remove files from the project, use the `delete_file` function. After deleting a file, only display a brief confirmation message on the screen.");
		this.settings = settings;
	}

	/**
	 * Execute
	 */
	async execute(params)
	{
		/* Get params */
		const file_path = params.path;
		if (!file_path)
		{
			throw new Error("File path not provided for deletion.");
		}
		if (typeof file_path !== "string")
		{
			throw new Error("Invalid file path type. Expected a string.");
		}
		
		/* Check file path and resolve to absolute path */
		const absolute_file_path = resolve(file_path, this.settings.workspaceFolderPath);
		
		try
		{
			/* Check if the file exists before attempting to delete */
			await fs.access(absolute_file_path, fs.constants.F_OK);
		}
		catch (error)
		{
			/* If file does not exist, throw a specific error */
			throw new Error(`File not found at '${file_path}'. Details: ${error.message}`);
		}
		
		/* Remove file */
		try
		{
			await fs.unlink(absolute_file_path);
		}
		catch (error)
		{
			throw new Error(`Could not delete file at '${file_path}'. Details: ${error.message}`);
		}
		
		return `Successfully deleted file: ${file_path}`;
	}
}