class Result
{
	constructor()
	{
		this.code = 0;
		this.message = "";
	}
	
	
	/**
	 * Clear
	 */
	clear()
	{
		this.code = 0;
		this.message = "";
	}
	
	
	/**
	 * Set api result
	 */
	setApiResult(result)
	{
		if (!result)
		{
			this.code = 0;
			this.message = "";
			return;
		}
		this.code = result.code;
		this.message = result.message;
	}
	
	
	/**
	 * Set wait message
	 */
	setWaitMessage()
	{
		this.code = 0;
		this.message = "Wait please ...";
	}
}
export default Result;