import { Tools } from "../Ai/Tool.js";
import { RandomTool } from "../Tools/RandomTool.js";
import { WriteFile } from "../Tools/WriteFile.js";
import { ReadFile } from "../Tools/ReadFile.js";
import { RenameFile } from "../Tools/RenameFile.js";
import { DeleteFile } from "../Tools/DeleteFile.js";
import { ListFiles } from "../Tools/ListFiles.js";
import { FindFileByName } from "../Tools/FindFileByName.js";
import { RunTool } from "../Tools/RunTool.js";
import { ToolsList } from "../Tools/ToolsList.js";
import { SearchFiles } from "../Tools/SearchFiles.js";


/**
 * Register tools
 */
export async function registerTools(settings)
{
	/* Create tools */
	var tools = new Tools();
	
	/* Create tools */
	tools.add(new RandomTool());
	tools.add(new WriteFile(settings));
	tools.add(new ReadFile(settings));
	tools.add(new RenameFile(settings));
	tools.add(new DeleteFile(settings));
	tools.add(new ListFiles(settings));
	tools.add(new FindFileByName(settings));
	tools.add(new RunTool(settings));
	tools.add(new ToolsList(settings));
	tools.add(new SearchFiles(settings));
	
	/* Register MCP */
	tools = tools.concat(settings.mcpService.createTools());
	
	/* Setup tools */
	settings.tools = tools;
}