export class ToolResult
{
	constructor()
	{
		this.id = "";
		this.name = "";
		this.arguments = "";
		this.args = null;
		this.tool = null;
		this.has_answer = false;
		this.answer = null;
		this.error = null;
	}
	
	
	/**
	 * Parse args
	 */
	parseArgs()
	{
		try
		{
			this.args = JSON.parse(this.arguments);
		}
		catch (error)
		{
			this.args = null;
		}
	}
	
	
	/**
	 * Returns answer
	 */
	getAnswer()
	{
		if (this.error)
		{
			const error = typeof this.error != "string" ? JSON.stringify(this.error) : this.error;
			return `Error: ${error}`;
		}
		return typeof this.answer != "string" ? JSON.stringify(this.answer) : this.answer;
	}
}