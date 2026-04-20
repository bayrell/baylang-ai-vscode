import path from "path";
import { existsSync, promises as fs } from "fs";
import { spawn } from "child_process";
import { Tool } from "../Ai/Tool.js";
import { parseCommandLine } from "../lib.js";

export class RunTool extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("run_tool");
		this.setDescription("Run an external tool from the tools folder with a command line parameters");
		this.addProps({
			key: "tool_name",
			type: "string",
			description: "Name of the tool file in tools folder (e.g., 'my-script.js' or 'my-script.py')",
			required: true,
		});
		this.addProps({
			key: "parameters",
			type: "string",
			description: "Command line parameters to pass to the tool. Output help if parameters does not exists.",
			required: false,
		});
		this.setPrompt("To run an external tool from the tools folder, use the `run_tool` function. Specify the tool name and an optional parameter.");
		this.settings = settings;
	}
	
	
	/**
	 * Returns true if can use in question
	 */
	canUse(question)
	{
		const tools_folder = path.join(
			this.settings.workspaceFolderPath, "tools"
		);
		try
		{
			return existsSync(tools_folder);
		}
		catch (error)
		{
			return false;
		}
	}
	
	
	/**
	 * Returns arguments text
	 */
	getArgumentsText(params)
	{
		const tool_name = params ? params.tool_name : "";
		const parameter = params ? params.parameters : [];
		return `(${JSON.stringify(tool_name)}, ${JSON.stringify(parameter)})`;
	}
	
	
	/**
	 * Execute function
	 */
	async execute(params)
	{
		let tool_name = params?.tool_name;
		let parameters = params?.parameters || "";
		
		/* Parse command line string */
		parameters = parseCommandLine(parameters);
		
		/* If tool name not found */
		if (!tool_name)
		{
			throw new Error("Tool name not provided");
		}
		
		/* Construct the path to the tool file */
		const tools_folder = path.join(this.settings.workspaceFolderPath, "tools");
		const tool_path = path.join(tools_folder, tool_name);
		
		/* Check if the file exists */
		try
		{
			await fs.access(tool_path);
		}
		catch (error)
		{
			throw new Error(`Tool file not found: ${tool_name}`);
		}
		
		/* Spawn the process */
		const child = spawn(tool_path, parameters, {
			cwd: this.settings.workspaceFolderPath
		});
		
		/* Collect output */
		let stdout = "";
		
		child.stdout.on("data", (data) => {
			stdout += data.toString();
		});
		
		child.stderr.on("data", (data) => {
			stdout += data.toString();
		});
		
		/* Wait for the process to finish */
		return new Promise((resolve, reject) => {
			child.on("close", (code) => {
				if (code !== 0)
				{
					reject(new Error(`Process exited with code ${code}: ${stdout}`));
				}
				else
				{
					/* Возвращаем stdout или stderr, если stdout пустой */
					resolve(stdout);
				}
			});
			
			child.on("error", (error) => {
				reject(new Error(`Failed to start process: ${error.message}`));
			});
		});
	}
}