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
			key: "content",
			type: "string",
			description: "File content",
			required: true,
		})
		this.setPrompt(`To update agent memory use \`update_memory\` tool.
# Memory goals

**Keep Memory Compressed**
   - Remove redundant information
   - Keep only essential facts
   - Combine related information into concise statements
**Structure Information**
   - Use clear headings and categories
   - Organize by importance and relevance
   - Maintain consistent formatting
**Periodic Cleanup**
   - Review memory regularly
   - Remove outdated information
   - Delete completed tasks unless they're reference points
   - Archive important historical data separately
**What to Keep**
   - Project description and purpose
   - Current technologies and frameworks
   - Development rules and conventions
   - Active tasks and recent work
   - Critical configuration settings
**What to Remove**
   - Duplicate information
   - Completed tasks (unless needed for reference)
   - Temporary notes
   - Obsolete configurations
   - Redundant explanations
**Rules**
- Be specific: Use clear, descriptive language
- Be concise: Avoid unnecessary words
- Be consistent: Use the same formatting throughout
- Be relevant: Keep only what's needed for current work
- Be organized: Group related information together

## Memory Optimization

When updating memory, follow these steps:
1. Review current memory content
2. Remove redundant or outdated information
3. Organize remaining information into clear categories
4. Add new relevant information
5. Ensure the memory is concise and easy to reference
6. Use consistent formatting throughout

Remember: The goal is to have a memory that is easy to search, understand, and maintain while containing only the most essential information for current development work.
`);
		this.settings = settings;
	}
	
	
	/**
	 * Execute
	 */
	async execute(params)
	{
		/* Get params */
		const content = params ? params.content : "";
		
		/* Check file path */
		const absolute_file_path = path.join(
			this.settings.workspaceFolderPath, ".vscode", "memory.md"
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
			throw new Error("Could not update memory. Details: " + error.message);
		}
		
		return "Success updated memory";
	}
}