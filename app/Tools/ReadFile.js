import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class ReadFile extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("read_file");
		this.setDescription("Read the content of multiple files from the disk by their paths within the current project. The file paths are relative.");
		this.addProps({
			key: "path",
			type: "array",
			items: { type: "string" },
			description: "Array of file paths in the project to read",
			required: true,
		});
		this.setPrompt("To read the content of files from the project, use the `read_file` function. After reading, the content of each file will be returned.");
		this.settings = settings;
	}
	
	
	/**
	 * Returns arguments text
	 * @param {object} params - The parameters for the tool.
	 * @returns {string} The string representation of the arguments.
	 */
	getArgumentsText(params)
	{
		const file_path = params ? params.path : [];
		return "(" + JSON.stringify(file_path) + ")";
	}
	
	
	/**
	 * Execute the read file operation.
	 * @param {object} params - The parameters for the tool containing file paths.
	 * @param {string[]} params.paths - An array of file paths to read.
	 * @returns {Promise<object[]>} A promise that resolves to an array of objects, each containing file_name and content or an error message.
	 */
	async execute(params)
	{
		/* Get params */
		const file_path = params ? params.path : [];
		
		if (typeof file_path == "string") file_path = [file_path];
		if (!file_path || !Array.isArray(file_path) || file_path.length === 0)
		{
			throw new Error("No file paths provided for reading.");
		}
		
		const results = [];
		for (const file_name of file_path)
		{
			let absolute_file_path = "";
			try
			{
				/* Check file path and resolve to absolute path */
				absolute_file_path = resolve(file_name, this.settings.workspaceFolderPath);
				
				/* Check if the file exists before attempting to read */
				await fs.access(absolute_file_path, fs.constants.F_OK);
				
				/* Read file content */
				const content = await fs.readFile(absolute_file_path, 'utf8');
				results.push({
					file_name: file_name,
					content: content
				});
			}
			catch (error)
			{
				if (error.code === 'ENOENT') // No Entry (file not found)
				{
					results.push({
						file_name: file_name,
						error: `Error: File not found at '${file_name}'.`
					});
				}
				else
				{
					results.push({
						file_name: file_name,
						error: `Error: Could not read file at '${file_name}'. Details: ${error.message}`
					});
				}
			}
		}
		
		/* Format the output for the AI */
		const formatted_output = results.map(result => {
			if (result.error)
			{
				return `Error read ${result.file_name}: ${result.error}`;
			}
			const file_prefix = "```";
			return `File: ${result.file_name}\n` +
				`${file_prefix}\n${result.content}\n${file_prefix}`;
		});
		
		return formatted_output.join("\n\n");
	}
}