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
		this.providers = "";
		this.secure = false;
		this.connection_timeout = 60000;
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
		
		/* Create body */
		var body = {
			model: this.model_id,
			messages: this.prompt,
			tools: this.tools ? this.tools.map((tool) => tool.getData()) : null,
			tool_choice: "auto",
			stream: true
		};
		
		/* Add provider */
		var has_provider = false;
		var provider = {};
		if (this.providers)
		{
			var providers = this.providers.split(",").map((s) => s.trim()).filter((s) => s != "");
			if (providers.length > 0)
			{
				provider["only"] = providers;
				has_provider = true;
			}
		}
		
		/* Add data secure */
		if (this.secure)
		{
			provider["data_collection"] = "deny";
			has_provider = true;
		}
		
		/* Add to body */
		if (has_provider) body["provider"] = provider;
		
		/* Save signal */
		let abort = this.signal;
		let has_messages = false;
		
		/* Create time */
		let timer_id = null;
		if (this.connection_timeout > 0)
		{
			timer_id = setTimeout(() => {
				if (has_messages) return;
				abort.abort();
			}, this.connection_timeout);
		}
		
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
				has_messages = true;
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
		
		if (timer_id)
		{
			clearTimeout(timer_id);
		}
	}
}
