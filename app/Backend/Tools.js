import { Tools } from "../Ai/Tool.js";
import { RandomTool } from "../Tools/RandomTool.js";
import { WriteFile } from "../Tools/WriteFile.js";
import { ReadFile } from "../Tools/ReadFile.js";
import { RenameFile } from "../Tools/RenameFile.js";
import { DeleteFile } from "../Tools/DeleteFile.js";
import { ListFiles } from "../Tools/ListFiles.js";
import { FindFileByName } from "../Tools/FindFileByName.js";
import { ReadMemory } from "../Tools/Memory/ReadMemory.js";
import { UpdateMemory } from "../Tools/Memory/UpdateMemory.js";
import { UpdateSoul } from "../Tools/Memory/UpdateSoul.js";
import { DeleteMemory } from "../Tools/Memory/DeleteMemory.js";
import { AddNote } from "../Tools/Memory/AddNote.js";
import { UpdateNote } from "../Tools/Memory/UpdateNote.js";
import { ReadNote } from "../Tools/Memory/ReadNote.js";
import { SearchNote } from "../Tools/Memory/SearchNote.js";
import { SaveCategory } from "../Tools/Memory/SaveCategory.js";
import { SaveTag } from "../Tools/Memory/SaveTag.js";


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
	tools.add(new ReadMemory(settings));
	tools.add(new UpdateMemory(settings));
	tools.add(new UpdateSoul(settings));
	tools.add(new DeleteMemory(settings));
	
	/* Notebook */
	tools.add(new AddNote(settings));
	tools.add(new UpdateNote(settings));
	tools.add(new ReadNote(settings));
	tools.add(new SearchNote(settings));
	tools.add(new SaveCategory(settings));
	tools.add(new SaveTag(settings));
	
	return tools;
}
