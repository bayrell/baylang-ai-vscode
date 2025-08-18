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