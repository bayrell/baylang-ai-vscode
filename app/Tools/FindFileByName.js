import path from "path";
import { promises as fs } from "fs";
import { minimatch } from "minimatch";
import { Tool } from "../Ai/Tool.js";

export class FindFileByName extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("find_file_by_name");
		this.setDescription("Search for files by their name pattern within the current project. Supports glob patterns like *.js, component_*.vue, etc.");
		this.addProps({
			key: "file_pattern",
			type: "string",
			description: "The file name pattern to search for (e.g., '*.js', 'component_*.vue', 'App.vue')",
			required: true,
		});
		this.addProps({
			key: "recursive",
			type: "boolean",
			description: "If true, searches recursively in subdirectories. Default is true.",
			required: false,
		});
		this.setPrompt("Use `find_file_by_name` tool to search for files by their name pattern. Supports glob patterns like '*.js', 'component_*.vue', etc.");
		this.settings = settings;
	}


	/**
	 * Returns arguments text
	 */
	getArgumentsText(params)
	{
		const file_pattern = params ? params.file_pattern : "";
		const recursive = params ? params.recursive !== false : true;
		
		return `(${file_pattern}, recursive=${recursive})`;
	}


	/**
	 * Execute search operation
	 */
	async execute(params)
	{
		const file_pattern = params ? params.file_pattern : "";
		const recursive = params ? params.recursive !== false : true;

		if (!file_pattern)
		{
			throw new Error("file_pattern parameter is required");
		}

		try
		{
			const search_results = await this.searchInDirectory(
				this.settings.workspaceFolderPath,
				file_pattern,
				recursive,
				""
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
	 * Search for files matching pattern in directory recursively
	 */
	async searchInDirectory(
		directory, file_pattern, recursive, folder
	)
	{
		const results = [];
		const entries = await fs.readdir(directory, { withFileTypes: true });

		for (const entry of entries)
		{
			const file_path = path.join(folder, entry.name);
			const full_path = path.join(directory, entry.name);

			if (entry.isDirectory())
			{
				// Skip .git and node_modules directories
				if (entry.name === ".git" || entry.name === "node_modules")
				{
					continue;
				}

				if (recursive)
				{
					const sub_results = await this.searchInDirectory(
						full_path,
						file_pattern,
						recursive,
						file_path
					);
					results.push(...sub_results);
				}
			}
			else if (entry.isFile())
			{
				// Check if file matches pattern using minimatch
				if (minimatch(file_path, file_pattern, { nocase: true, matchBase: true }))
				{
					results.push({
						file_name: entry.name,
						path: path.relative(this.settings.workspaceFolderPath, full_path),
					});
				}
			}
		}

		return results;
	}
}