import path from "path";
import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class WriteFile extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("write_file");
		this.setDescription("Write file on disk by path in current project. File path is relative.");
		this.addProps({
			key: "path",
			type: "string",
			description: "File path in project",
			required: true,
		});
		this.addProps({
			key: "content",
			type: "string",
			description: "File content",
			required: true,
		})
		this.setPrompt("To modify files within the project or add content to it, use the `write_file` function. If you are writing a file, only display a brief summary of the modifications you made on the screen.");
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
		const content = params ? params.content : "";
		if (!file_path)
		{
			throw new Error("File path not found")
		}
		if (typeof file_path !== "string")
		{
			throw new Error("File path not found");
		}
		
		/* Check file path */
		const absolute_file_path = resolve(file_path, this.settings.workspaceFolderPath);
		
		/* Create folder */
		const dir_name = path.dirname(absolute_file_path);
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
			await fs.writeFile(absolute_file_path, content, "utf8");
		}
		catch (error)
		{
			throw new Error("Could not write file to " + relative_file_path + ". Details: " + error.message);
		}
		
		return "Success file write";
	}
}