class ChatMessage
{
	id = "";
	sender = "";
	text = "";
	
	
	/**
	 * Assign
	 */
	assign(data)
	{
		this.id = data.id;
		this.sender = data.sender;
		this.text = data.text;
	}
	
	
	/**
	 * Returns lines
	 */
	getLines()
	{
		return this.text.split("\n");
	}
}

export default ChatMessage;