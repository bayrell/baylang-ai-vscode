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
export function getFileExtension(filename)
{
	var arr = filename.split(".");
	return arr.pop();
}

/**
 * Fetch + stream
 */
export async function fetchEventSource(url, {
	method = "GET",
	headers = {},
	body = null,
	onopen,
	onmessage,
	onerror,
	signal
}) {
	try
	{
		const response = await fetch(url, {
			method,
			headers,
			body,
			signal,
		});
		
		/* Response error */
		if (!response.ok)
		{
			if (onerror)
			{
				await onerror(new Error(`Bad response: ${response.statusText}`));
			}
			return;
		}
		
		/* Open connection */
		if (onopen) await onopen(response);
		
		/* Read stream */
		const reader = response.body.getReader();
		const decoder = new TextDecoder("utf-8");
		let buffer = "";
		
		while (true)
		{
			const { done, value } = await reader.read();
			if (done) break;
			
			buffer += decoder.decode(value, { stream: true });
			const parts = buffer.split("\n\n");
			buffer = parts.pop();
			
			for (let part of parts)
			{
				part = part.trim();
				if (!part.startsWith("data:")) continue;
				
				const data = part.replace(/^data:\s*/, "");
				if (onmessage)
				{
					await onmessage(data);
				}
			}
		}
	}
	catch (err)
	{
		if (onerror)
		{
			await onerror(err);
		}
	}
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
		this.message = response.message || (this.isSuccess() ? "Ok" : "Error");
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