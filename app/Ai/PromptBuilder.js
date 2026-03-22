export class PromptBuilder
{
	constructor()
	{
		this.messages = [];
	}
	
	
	/**
	 * Add message
	 */
	addMessage(tag, content, cache)
	{
		if (Array.isArray(content)) content = content.join("\n\n");
		if (!content) return;
		var obj = {
			"role": tag,
			"content": content,
		};
		if (cache == true || cache == undefined)
		{
			obj["cache_control"] = this.cache();
		}
		this.messages.push(obj);
	}
	
	
	/**
	 * Cache string
	 */
	cache()
	{
		return {
			type: "ephemeral",
		};
	}
	
	
	/**
	 * Add current date
	 */
	addCurrentDate()
	{
		const current_date = new Date();
		this.addMessage("system", `Current date: ${current_date.toString()}\n`, false);
	}
	
	
	/**
	 * Add file
	 */
	addFiles(files)
	{
		const getFile = (file) =>
		{
			if (file.error || !file.readed) return null;
			if (file.isText())
			{
				return {
					type: "text",
					text: file.getContent(),
				};
			}
			var fileContent = file.getContent();
			if (file.isImage())
			{
				return {
					type: "image_url",
					image_url: {
						url: fileContent,
					}
				}
			}
			return {
				type: "file",
				file: {
					filename: file.name,
					file_data: fileContent,
				}
			};
		};
		
		files = files.map(file => getFile(file)).filter(file => file != null);
		if (files.length > 0)
		{
			this.messages.push({
				role: "user",
				content: files,
				cache_control: this.cache(),
			});
		}
	}
	
	
	/**
	 * Add tools
	 */
	addTools(tools)
	{
		if (tools.length == 0) return;
		this.messages.push({
			role: "assistant",
			tool_calls: tools.map((tool) => {
				return {
					type: "function",
					id: tool.id,
					function: { name: tool.name, arguments: tool.arguments },
				}
			}),
			cache_control: this.cache(),
		});
	}
	
	
	/**
	 * Add tool result
	 */
	addToolResult(tool_result)
	{
		this.messages.push({
			role: "tool",
			tool_call_id: tool_result.id,
			name: tool_result.name,
			content: tool_result.getAnswer(),
			cache_control: this.cache(),
		})
	}
}