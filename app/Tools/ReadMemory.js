import path from "path";
import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";

export class ReadMemory extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("read_memory");
		this.setDescription("Read agent memory");
		this.setPrompt(`To read agent memory use \`read_memory\` tool`);
		this.settings = settings;
	}
	
	
	/**
	 * Execute
	 */
	async execute(params)
	{
		/* Check file path */
		const absolute_file_path = path.join(
			this.settings.workspaceFolderPath, ".vscode", "memory.md"
		);
		
		var content = "";
		try
		{
			content = await fs.readFile(absolute_file_path, "utf8");
		}
		catch (error)
		{
			throw new Error("Could not read memory. Details: " + error.message);
		}
		
		return content;
	}
}