import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class DeleteFile extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("delete_file");
		this.setDescription("Delete multiple files from the disk by its path within the current project. The file path is relative.");
		this.addProps({
			key: "path",
			type: "array",
			items: { type: "string" },
			description: "Array of file path in project to delete",
			required: true,
		})
		this.setPrompt("To remove files from the project, use the `delete_file` function. After deleting a file, only display a brief confirmation message on the screen.");
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
	 * Execute
	 */
	async execute(params)
	{
		/* Get params */
		const file_path = params ? params.path : "";
		if (!file_path)
		{
			throw new Error("File path not provided for deletion.");
		}
		if (!Array.isArray(file_path))
		{
			throw new Error("Invalid file path type. Expected a string.");
		}
		
		var result = [];
		for (var i=0; i<file_path.length; i++)
		{
			var file_name = file_path[i];
			
			/* Check file path and resolve to absolute path */
			var absolute_file_path = "";
			
			try
			{
				/* Check if the file exists before attempting to delete */
				absolute_file_path = resolve(file_name, this.settings.workspaceFolderPath);
				await fs.access(absolute_file_path, fs.constants.F_OK);
			}
			catch (error)
			{
				/* If file does not exist, throw a specific error */
				result.push(`Error: File not found at '${file_name}'. Details: ${error.message}`);
				continue;
			}
			
			/* Remove file */
			try
			{
				await fs.unlink(absolute_file_path);
			}
			catch (error)
			{
				result.push(`Error: Could not delete file at '${file_name}'. ` +
					`Details: ${error.message}`);
				continue;
			}
			
			result.push(`Successfully deleted file: ${file_name}`);
		}
		
		return result.join("\n");
	}
}