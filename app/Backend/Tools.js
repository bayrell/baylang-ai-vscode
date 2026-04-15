import { Tools } from "../Ai/Tool.js";
import { RandomTool } from "../Tools/RandomTool.js";
import { WriteFile } from "../Tools/WriteFile.js";
import { ReadFile } from "../Tools/ReadFile.js";
import { RenameFile } from "../Tools/RenameFile.js";
import { DeleteFile } from "../Tools/DeleteFile.js";
import { ListFiles } from "../Tools/ListFiles.js";
import { ReadMemory } from "../Tools/ReadMemory.js";
import { UpdateMemory } from "../Tools/UpdateMemory.js";
import { FindFileByName } from "../Tools/FindFileByName.js";
import { ChatHistory } from "../Tools/ChatHistory.js";
import { ReadChatHistory } from "../Tools/ReadChatHistory.js";


/**
 * Register tools
 */
export async function registerTools(settings)
{
	var tools = new Tools();
	
	/* Create tools */
	tools.add(new RandomTool());
	tools.add(new WriteFile(settings));
	tools.add(new ReadFile(settings));
	tools.add(new RenameFile(settings));
	tools.add(new DeleteFile(settings));
	tools.add(new ListFiles(settings));
	tools.add(new FindFileByName(settings));
	
	/* Memory */
	tools.add(new ChatHistory(settings));
	tools.add(new ReadChatHistory(settings));
	tools.add(new ReadMemory(settings));
	tools.add(new UpdateMemory(settings));
	
	return tools;
}
