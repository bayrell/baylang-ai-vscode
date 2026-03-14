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
		this.addProps({
			key: "name",
			type: "string",
			description: "Memory name (e.g., 'main', 'user_data', 'sessions')",
			required: false,
			default_value: "main"
		});
		this.setPrompt(`To read agent memory use \`read_memory\` tool.\nAvailable memory names: main, user_data, sessions, context, or custom names.`);
		this.settings = settings;
	}
	
	
	/**
	 * Execute
	 */
	async execute(params)
	{
		/* Get memory name */
		const memory_name = params && params.name ? params.name : "main";
		
		/* Check file path */
		const absolute_file_path = path.join(
			this.settings.workspaceFolderPath, ".vscode", "memory", `${memory_name}.md`
		);
		
		var content = "";
		try
		{
			content = await fs.readFile(absolute_file_path, "utf8");
		}
		catch (error)
		{
			throw new Error(`Could not read memory '${memory_name}'. Details: ` + error.message);
		}
		
		return content;
	}
}
