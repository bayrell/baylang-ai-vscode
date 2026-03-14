import path from "path";
import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";
import { resolve } from "./Helper.js";

export class SearchFiles extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("search_files");
		this.setDescription("Search for files by their content within the current project. Can filter by file name pattern.");
		this.addProps({
			key: "content",
			type: "string",
			description: "The content to search for in files",
			required: true,
		});
		this.addProps({
			key: "file_pattern",
			type: "string",
			description: "Optional file name pattern to filter files (e.g., '*.txt', '*.php', '*.js')",
			required: false,
		});
		this.setPrompt("Use `search_files` tool to find files containing specific content. You can optionally filter by file name pattern like '*.txt' or '*.php'.");
		this.settings = settings;
	}


	/**
	 * Returns arguments text
	 */
	getArgumentsText(params)
	{
		const content = params ? params.content : "";
		const file_pattern = params ? params.file_pattern : "";
		
		if (file_pattern)
		{
			return `(${content}, ${file_pattern})`;
		}
		return `(${content})`;
	}


	/**
	 * Execute search operation
	 */
	async execute(params)
	{
		const content = params ? params.content : "";
		const file_pattern = params ? params.file_pattern : "";

		if (!content)
		{
			throw new Error("content parameter is required");
		}

		try
		{
			const search_results = await this.searchInDirectory(
				this.settings.workspaceFolderPath,
				content,
				file_pattern
			);

			return {
				success: true,
				results: search_results,
				count: search_results.length,
			};
		}
		catch (error)
		{
			throw new Error(`Failed to search files: ${error.message}`);
		}
	}


	/**
	 * Search for content in directory recursively
	 */
	async searchInDirectory(directory, search_content, file_pattern)
	{
		const results = [];
		const entries = await fs.readdir(directory, { withFileTypes: true });

		for (const entry of entries)
		{
			const full_path = path.join(directory, entry.name);

			if (entry.isDirectory())
			{
				// Skip .git and node_modules directories
				if (entry.name === ".git" || entry.name === "node_modules")
				{
					continue;
				}

				const sub_results = await this.searchInDirectory(
					full_path,
					search_content,
					file_pattern
				);
				results.push(...sub_results);
			}
			else if (entry.isFile())
			{
				// Check if file matches pattern
				if (file_pattern && !this.matchesPattern(entry.name, file_pattern))
				{
					continue;
				}

				try
				{
					const file_content = await fs.readFile(full_path, "utf8");
					if (file_content.includes(search_content))
					{
						results.push({
							file_name: entry.name,
							path: path.relative(this.settings.workspaceFolderPath, full_path),
						});
					}
				}
				catch (error)
				{
					// Skip files that can't be read (e.g., binary files)
					continue;
				}
			}
		}

		return results;
	}


	/**
	 * Check if file name matches pattern
	 * Supports patterns like *.txt, *.php, etc.
	 */
	matchesPattern(file_name, pattern)
	{
		if (!pattern)
		{
			return true;
		}

		// Convert glob pattern to regex
		// *.txt -> .*\.txt$
		// *.php -> .*\.php$
		const regex_pattern = pattern
			.replace(/\./g, "\\.")
			.replace(/\*/g, ".*");
		const regex = new RegExp(`^${regex_pattern}$`, "i");
		
		return regex.test(file_name);
	}
}
