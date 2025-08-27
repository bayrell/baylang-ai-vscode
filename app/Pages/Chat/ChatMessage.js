import { getFileName } from "@main/lib.js";
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

class ChatMessage
{
	id = "";
	sender = "";
	content = [];
	formated = false;
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		this.id = data.id;
		this.sender = data.sender;
		this.content = data.content;
	}
	
	
	/**
	 * Returns lines
	 */
	getLines()
	{
		if (Array.isArray(this.content)) return this.content;
		return [];
	}
	
	
	/**
	 * Last line
	 */
	lastLine()
	{
		var lines = this.getLines();
		if (lines.length == 0) return null;
		return lines[lines.length - 1];
	}
	
	
	/**
	 * Format message
	 */
	format(layout)
	{
		if (this.formated) return;
		
		var lines = this.getLines();
		var merged_lines = [];
		var last_content = "";
		var prev_line = null;
		
		for (var line of lines)
		{
			if (line.block == "text")
			{
				if (last_content != "")
				{
					if (prev_line && prev_line.block == "text" && prev_line.content[0] == "|")
						last_content += "\n";
					else
						last_content += "\n\n";
				}
				last_content += line.content;
			}
			else
			{
				if (last_content != "")
				{
					merged_lines.push({
						block: "text",
						content: last_content,
					});
					last_content = "";
				}
				merged_lines.push(line);
			}
			prev_line = line;
		}
		
		if (last_content != "")
		{
			merged_lines.push({
				block: "text",
				content: last_content,
			});
			last_content = "";
		}
		
		this.formated = true;
		this.content = merged_lines.map((line) => {
			if (line.block == "text")
			{
				var html = layout.parser.render(line.content || "");
				html = DOMPurify.sanitize(html, {
					USE_PROFILES: { html: true }
				});
				
				return {
					...line, html
				};
			}
			else if (line.block == "code")
			{
				var html = this.constructor.formatCode(line);
				return {
					...line, html
				};
			}
			return line;
		});
	}
	
	
	/**
	 * Returns code content
	 */
	static getCodeContent(item)
	{
		var arr = item.content.split("\n");
		if (arr.length == 0) return "";
		if (arr[0].substring(0, 3) == "```") arr.splice(0, 1);
		if (arr[arr.length - 1].substring(0, 3) == "```") arr.splice(arr.length - 1, 1);
		return arr.join("\n");
	}
	
	
	/**
	 * Format code
	 */
	static formatCode(item)
	{
		var content = this.getCodeContent(item);
		var language = item.language.toLowerCase();
		if (language !== 'auto' && hljs.getLanguage(language))
		{
			return hljs.highlight(content, {
				language: language
			}).value;
		}
		else
		{
			return hljs.highlightAuto(content).value;
		}
	}
	
	
	/**
	 * Parse content
	 */
	static parseContent(content)
	{
		var items = [];
		var code_content = [];
		var code_language = "";
		var lines = content.split("\n");
		var is_code = false;
		
		for (var i=0; i<lines.length; i++)
		{
			var line = lines[i];
			line = line.trim();
			if (line == "") continue;
			if (line.substring(0, 3) == "```")
			{
				is_code = !is_code;
				if (is_code)
				{
					code_content = [];
					code_language = line.substring(3);
				}
				else
				{
					items.push(
						{
							"block": "code",
							"content": code_content.join("\n"),
							"language": code_language,
						}
					);
				}
			}
			else
			{
				if (!is_code)
				{
					items.push(
						{
							"block": "text",
							"content": line,
						}
					);
				}
				else
				{
					code_content.push(line);
				}
			}
		}
		
		if (is_code)
		{
			items.push(
				{
					"block": "code",
					"content": code_content.join("\n"),
					"language": code_language,
				}
			);
		}
		
		return items;
	}
	
	
	/**
	 * Add files
	 */
	addFiles(files)
	{
		for (var i=0; i<files.length; i++)
		{
			var file = files[i];
			this.content.push({
				"block": "textfile",
				"filename": getFileName(file.path),
				"content": file.content,
			});
		}
	}
	
	
	/**
	 * Set new content
	 */
	setContent(content)
	{
		if (!Array.isArray(content))
		{
			content = this.constructor.parseContent(content);
		}
		
		/* Concat */
		this.content = this.content.concat(content);
	}
}

export default ChatMessage;