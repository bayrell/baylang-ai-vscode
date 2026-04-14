import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";
import { FileResult } from "../Ai/FileResult.js";

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
	async execute(params, question)
	{
		/* Get params */
		let file_path = params ? params.path : [];
		
		/* Check params */
		if (typeof file_path == "string") file_path = [file_path];
		if (!file_path || !Array.isArray(file_path) || file_path.length === 0)
		{
			throw new Error("No file paths provided for reading.");
		}
		
		/* Read files */
		const results = [];
		for (const file_name of file_path)
		{
			let file = new FileResult();
			file.name = file_name;
			try
			{
				/* Check file path and resolve to absolute path */
				file.path = resolve(file_name, this.settings.workspaceFolderPath);
				
				/* Check if the file exists before attempting to read */
				await fs.access(file.path, fs.constants.F_OK);
				
				/* Read file content */
				await file.read();
			}
			catch (error)
			{
				if (error.code === 'ENOENT') // No Entry (file not found)
				{
					file.error = `File not found at '${file_name}'.`;
				}
				else
				{
					file.error = `Could not read file at '${file_name}'. Details: ${error.message}`;
				}
			}
			results.push(file);
		}
		
		/* Format output */
		let files = [];
		let formatted_output = [];
		for (let i=0; i<results.length; i++)
		{
			let file = results[i];
			if (file.error)
			{
				formatted_output.push(`Error: ${file.error}`);
				continue;
			}
			if (file.isText())
			{
				formatted_output.push(file.getContent());
				file.virtual = true;
			}
			else formatted_output.push(`Success read file: '${file.name}'`);
			files.push(file);
		}
		
		/* Add files */
		await question.addFiles(files);
		return formatted_output.join("\n\n");
	}
}