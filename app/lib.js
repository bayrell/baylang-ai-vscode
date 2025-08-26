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
export function htmlUnescape(str)
{
	return str
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}
export function removeFirstSlash(path)
{
	var i = 0;
	while (i < path.length && path[i] == "/") i++;
	return path.substring(i);
}
export function removeLastSlash(path)
{
	var i = path.length - 1;
	while (i >= 0 && path[i] == "/") i--;
	return path.substring(0, i + 1);
}
export function urlJoin(...args)
{
	var url = args[0];
	for (var i=1; i<args.length; i++)
	{
		var item = removeFirstSlash(args[i]);
		if (item == "") continue;
		url = removeLastSlash(url) + "/" + item;
	}
	return url;
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
	 * Constructor
	 */
	constructor(response)
	{
		if (response) this.assign(response);
	}
	
	
	/**
	 * Assign response
	 */
	assign(response)
	{
		this.response = response;
		if (response.code != undefined) this.code = response.code;
		else if (response.success != undefined) this.code = response.success ? 1 : -1;
		this.message = response.message || "";
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