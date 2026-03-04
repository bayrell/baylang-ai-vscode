export class MessageItem
{
	constructor(block)
	{
		this.block = block || "";
		this.content = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(item)
	{
		this.block = item.block;
		this.content = item.content;
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return {
			"block": this.block,
			"content": this.content,
		};
	}
	
	
	/**
	 * Returns true if empty
	 */
	isEmpty()
	{
		return this.content == "";
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		return this.content;
	}
	
	
	/**
	 * Add token
	 */
	addToken(token)
	{
		this.content += token;
	}
	
	
	/**
	 * Trim content
	 */
	trim()
	{
	}
}

export class TextItem extends MessageItem
{
	constructor()
	{
		super("text");
	}
}

export class CodeItem extends MessageItem
{
	constructor()
	{
		super("code");
		this.language = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(item)
	{
		super.assign(item);
		this.language = item.language;
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		var data = super.getData();
		data["language"] = this.language;
		return data;
	}
	
	
	/**
	 * Returns true if line is tag
	 */
	static isTag(line)
	{
		return line.trim().substring(0, 3) == "```";
	}
	
	
	/**
	 * Detect language
	 */
	detectLanguage()
	{
		var lines = this.content.split("\n");
		if (lines.length == 0) return;
		var line = lines[0].trim();
		this.language = line.substring(3);
	}
	
	
	/**
	 * Is end of block
	 */
	isBlockEnd()
	{
		var content = this.content.trim();
		return content.length >= 6 && content.substring(content.length - 3) == "```";
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		return "```" + this.language + "\n" + this.content + "```";
	}
	
	
	/**
	 * Trim content
	 */
	trim()
	{
		var lines = this.content.split("\n");
		if (lines.length > 0)
		{
			if (this.constructor.isTag(lines[0]))
			{
				lines = lines.slice(1);
			}
		}
		if (lines.length > 0)
		{
			if (this.constructor.isTag(lines[lines.length - 1]))
			{
				lines = lines.slice(0, -1);
			}
		}
		this.content = lines.join("\n");
	}
}

export class FileItem extends MessageItem
{
	constructor()
	{
		super("textfile");
		this.filename = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(item)
	{
		super.assign(item);
		this.filename = item.filename;
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		var data = super.getData();
		data["filename"] = this.filename;
		return data;
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		return "Filename: " + this.filename + "\n" + "```" + this.content + "```";
	}
}

/**
 * Convert item to message
 */
export function createMessageItem(item)
{
	var message_item = null;
	if (item.block == "text") message_item = new TextItem();
	else if (item.block == "code") message_item = new CodeItem();
	else if (item.block == "textfile") message_item = new FileItem();
	else message_item = new MessageItem();
	message_item.assign(item);
	return message_item;
}


export class Message
{
	constructor(content)
	{
		this.id = 0;
		this.sender = "";
		this.content = content || [];
		this.content = this.content.map((item) => createMessageItem(item));
	}
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		this.id = data.id;
		this.sender = data.sender;
		this.content = data.content ? data.content.map((item) => createMessageItem(item)) : [];
	}
	
	
	/**
	 * Returns name
	 */
	getName()
	{
		if (this.sender == "agent") return "Agent";
		if (this.sender == "user") return "User";
		return this.sender;
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		var content = this.content.map((item) => item.getText());
		return content.join("\n\n");
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return {
			"id": this.id,
			"sender": this.sender,
			"content": this.content.map((item) => item.getData()),
		};
	}
	
	
	/**
	 * Returns last item
	 */
	getLastItem()
	{
		if (this.content.length == 0) return null;
		return this.content[this.content.length - 1];
	}
	
	
	/**
	 * Replace last item
	 */
	replaceLastItem(item)
	{
		this.content[this.content.length - 1] = item;
	}
	
	
	/**
	 * Add text item
	 */
	addTextItem(data)
	{
		var item = new TextItem();
		if (data != undefined)
		{
			item.assign(data);
		}
		this.content.push(item);
		return item;
	}
	
	
	/**
	 * Add new line
	 */
	addNewLine(last)
	{
		if (last instanceof TextItem)
		{
			if (CodeItem.isTag(last.content))
			{
				var new_item = new CodeItem();
				new_item.content = last.content;
				new_item.addToken("\n");
				new_item.detectLanguage();
				this.replaceLastItem(new_item);
				return new_item;
			}
		}
		if (last instanceof CodeItem)
		{
			if (!last.isBlockEnd())
			{
				last.addToken("\n");
				return last;
			}
		}
		if (!last.isEmpty())
		{
			return this.addTextItem();
		}
		return last;
	}
	
	
	/**
	 * Add chunk
	 */
	addChunk(chunk)
	{
		var last = this.getLastItem();
		if (last == null) last = this.addTextItem();
		for (var i=0; i<chunk.length; i++)
		{
			var char = chunk[i];
			if (char == "\n")
			{
				last = this.addNewLine(last);
			}
			else
			{
				last.addToken(char);
			}
		}
	}
	
	
	/**
	 * Trim
	 */
	trim()
	{
		for (var i=0; i<this.content.length; i++)
		{
			this.content[i].trim();
		}
	}
}


export class ToolMessage extends Message
{
	constructor()
	{
		super();
		this.sender = "tool";
		this.tool = null;
		this.tool_id = "";
		this.tool_name = "";
		this.tool_answer = "";
		this.tool_error = "";
	}
	
	
	/**
	 * Assign data
	 */
	assign(data)
	{
		if (data.id) this.id = data.id;
		if (data.tool_id) this.tool_id = data.tool_id;
		if (data.tool_name) this.tool_name = data.tool_name;
		if (data.tool_answer) this.tool_answer = data.tool_answer;
		if (data.tool_error) this.tool_error = data.tool_error;
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return {
			id: this.id,
			sender: this.sender,
			tool_id: this.tool_id,
			tool_name: this.tool_name,
			tool_answer: this.tool_answer,
			tool_error: this.tool_error,
		};
	}
	
	
	/**
	 * Returns text
	 */
	getText()
	{
		return "Execute: " + this.tool_name;
	}
}

/**
 * Create message by data
 */
export function createMessage(data)
{
	var message = null;
	if (data.sender == "tool") message = new ToolMessage();
	else message = new Message();
	message.assign(data);
	return message;
}