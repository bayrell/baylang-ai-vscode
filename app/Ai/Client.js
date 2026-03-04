import { fetchEventSource } from "../lib.js";

export class Client
{
	constructor(model, model_id)
	{
		this.model = model;
		this.model_id = model_id;
		this.prompt = null;
		this.callback = null;
		this.source = null;
		this.signal = new AbortController();
		this.tools = null;
	}
	
	
	/**
	 * Set callback
	 */
	setCallback(value)
	{
		this.callback = value;
	}
	
	
	/**
	 * Send
	 */
	async send()
	{
		if (!this.model)
		{
			await this.callback("error", new Error("Model not found"));
			return;
		}
		if (!this.model_id)
		{
			await this.callback("error", new Error("Model name not found"));
			return;
		}
		
		var url = this.model.getUrl("chat/completions");
		if (!url)
		{
			await this.callback("error", new Error("URL not found"));
			return;
		}
		
		var body = {
			model: this.model_id,
			messages: this.prompt,
			tools: this.tools ? this.tools.getData() : null,
			tool_choice: "auto",
			stream: true
		};
		
		var abort = this.signal;
		await fetchEventSource(url, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + this.model.getKey(),
				"Content-Type": "application/json",
				"HTTP-Referer": "https://baylang.com/",
				"X-Title": "BayLang AI",
			},
			body: JSON.stringify(body),
			signal: abort.signal,
			onopen: async () => {
				await this.callback("open");
			},
			onmessage: async (data) => {
				if (data == "[DONE]") return;
				try
				{
					var chunk = JSON.parse(data);
					var tool_calls = chunk.choices[0]?.delta?.tool_calls;
					if (tool_calls)
					{
						await this.callback("tool", tool_calls);
					}
					else
					{
						await this.callback("chunk", chunk);
					}
				}
				catch (e){}
			},
			onerror: async (error) => {
				await this.callback("error", error);
			},
		});
	}
}
