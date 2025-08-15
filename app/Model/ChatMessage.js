import { getFileName } from "../lib.js";

class ChatMessage
{
	id = "";
	sender = "";
	content = [];
	
	
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