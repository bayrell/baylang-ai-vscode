export function apply(object, method_name, args)
{
    var method = object[method_name].bind(object);
    return method.apply(null, args);
}
export function callback(object, method){
    return (...args) =>
    {
        return apply(object, method, args);
    }
}
export function getFileName(file)
{
    var arr = file.split("/");
    return arr.pop();
}


/**
 * Api result
 */
export class ApiResult
{
	code = 0;
	message = "";
	data = {};
	response = null;
	
	
	/**
	 * Assign response
	 */
	assign(response)
	{
		this.response = response;
		if (response.code) this.code = response.code;
		else if (response.success) this.code = response.success ? 1 : -1;
		this.message = response.message;
		this.data = response.data || {};
	}
	
	
	/**
	 * Returns true if error
	 */
	isError()
	{
		return this.code < 0;
	}
	
	
	/**
	 * Returns true if success
	 */
	isSuccess()
	{
		return this.code > 0;
	}
	
	
	/**
	 * Returns data
	 */
	getData()
	{
		return this.data;
	}
}