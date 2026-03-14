import path from "path";
import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";

export class UpdateMemory extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("update_memory");
		this.setDescription("Update agent memory");
		this.addProps({
			key: "name",
			type: "string",
			description: "Memory name (e.g., 'main', 'user_data', 'sessions')",
			required: false,
			default_value: "main"
		});
		this.addProps({
			key: "content",
			type: "string",
			description: "File content",
			required: true,
		})
		this.setPrompt(`To update agent memory use \`update_memory\` tool.\nAvailable memory names: main, user_data, sessions, context, or custom names.`);
		this.settings = settings;
	}
	
	
	/**
	 * Execute
	 */
	async execute(params)
	{
		/* Get params */
		const content = params ? params.content : "";
		const memory_name = params && params.name ? params.name : "main";
		
		/* Check file path */
		const absolute_file_path = path.join(
			this.settings.workspaceFolderPath, ".vscode", "memory", `${memory_name}.md`
		);
		
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
			throw new Error(`Could not update memory '${memory_name}'. Details: ` + error.message);
		}
		
		return `Success updated memory '${memory_name}'`;
	}
}
