import path from "path";
import { promises as fs } from "fs";
import { Tool } from "../Ai/Tool.js";

export class SearchFiles extends Tool
{
	constructor(settings)
	{
		super();
		this.setName("search_regex");
		this.setDescription("Search for content in files using grep-like functionality. Returns matches with line numbers and context.");
		this.addProps({
			key: "pattern",
			type: "string",
			description: "Search pattern (string or regex)",
			required: true,
		});
		this.addProps({
			key: "file_pattern",
			type: "string",
			description: "Optional file name pattern to filter files (e.g., '*.txt', '*.php', '*.js')",
			required: false,
		});
		this.addProps({
			key: "context_lines",
			type: "number",
			description: "Number of context lines to show around matches (default: 0)",
			required: false,
		});
		this.addProps({
			key: "case_insensitive",
			type: "boolean",
			description: "Case insensitive search (default: false)",
			required: false,
		});
		this.setPrompt("Use `grep_search` tool to find content in files with line numbers and context. Supports regex patterns and file filtering.");
		this.settings = settings;
	}


	/**
	 * Returns arguments text
	 */
	getArgumentsText(params)
	{
		const pattern = params ? params.pattern : "";
		const file_pattern = params ? params.file_pattern : "";
		const case_insensitive = params ? params.case_insensitive : false;
		
		let args = `(${pattern}`;
		if (file_pattern) args += `, ${file_pattern}`;
		if (case_insensitive) args += `, case_insensitive`;
		args += ")";
		
		return args;
	}


	/**
	 * Execute grep search
	 */
	async execute(params)
	{
		const pattern = params ? params.pattern : "";
		const file_pattern = params ? params.file_pattern : "";
		const context_lines = params ? params.context_lines || 0 : 0;
		const case_insensitive = params ? params.case_insensitive || false : false;

		if (!pattern)
		{
			throw new Error("pattern parameter is required");
		}

		try
		{
			const search_results = await this.searchInDirectory(
				this.settings.workspaceFolderPath,
				pattern,
				file_pattern,
				context_lines,
				case_insensitive
			);

			return {
				success: true,
				results: search_results,
				count: search_results.length,
			};
		}
		catch (error)
		{
			throw new Error(`Failed to grep search: ${error.message}`);
		}
	}


	/**
	 * Search for content in directory recursively
	 */
	async searchInDirectory(directory, pattern, file_pattern, context_lines, case_insensitive)
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
					pattern,
					file_pattern,
					context_lines,
					case_insensitive
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
					const file_matches = await this.searchInFile(
						full_path,
						pattern,
						context_lines,
						case_insensitive
					);
					
					if (file_matches.length > 0)
					{
						results.push({
							file_name: entry.name,
							path: path.relative(this.settings.workspaceFolderPath, full_path),
							matches: file_matches,
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
	 * Search for pattern in a single file
	 */
	async searchInFile(file_path, pattern, context_lines, case_insensitive)
	{
		const matches = [];
		const content = await fs.readFile(file_path, "utf8");
		const lines = content.split("\n");
		
		// Create regex from pattern
		const flags = case_insensitive ? "gi" : "g";
		let regex;
		try
		{
			regex = new RegExp(pattern, flags);
		}
		catch (e)
		{
			// If regex is invalid, use simple string search
			regex = null;
		}

		for (let i = 0; i < lines.length; i++)
		{
			const line = lines[i];
			let is_match = false;
			
			if (regex)
			{
				regex.lastIndex = 0;
				is_match = regex.test(line);
			}
			else
			{
				is_match = case_insensitive 
					? line.toLowerCase().includes(pattern.toLowerCase())
					: line.includes(pattern);
			}
			
			if (is_match)
			{
				const match = {
					line_number: i + 1,
					line: line.trim(),
				};
				
				// Add context lines if requested
				if (context_lines > 0)
				{
					const context_start = Math.max(0, i - context_lines);
					const context_end = Math.min(lines.length - 1, i + context_lines);
					const context = [];
					
					for (let j = context_start; j <= context_end; j++)
					{
						context.push({
							line_number: j + 1,
							line: lines[j].trim(),
							is_match: j === i,
						});
					}
					
					match.context = context;
				}
				
				matches.push(match);
			}
		}
		
		return matches;
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
		const regex_pattern = pattern
			.replace(/\./g, "\\.")
			.replace(/\*/g, ".*");
		const regex = new RegExp(`^${regex_pattern}$`, "i");
		
		return regex.test(file_name);
	}
}