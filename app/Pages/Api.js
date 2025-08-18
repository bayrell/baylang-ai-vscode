import { ApiResult } from "@main/lib.js";

class Api
{
	/**
	 * Create api
	 */
	constructor(layout)
	{
		this.layout = layout;
		this.listeners = [];
		this.pending_requests = {};
		this.request_id = 0;
	}
	
	
	/**
	 * Bind events
	 */
	bind()
	{
		window.addEventListener("message", this.onMessage.bind(this));
	}
	
	
	/**
	 * On message
	 */
	onMessage(event)
	{
		var msg = event.data;
		if (msg.request_id && this.pending_requests[msg.request_id])
		{
			var promise = this.pending_requests[msg.request_id];
			if (msg.payload)
			{
				var result = new ApiResult();
				result.assign(msg.payload);
				promise.resolve(result);
			}
			else if (msg.error)
			{
				var error = msg.error;
				if (msg.stack) error = error + "\n" + msg.stack;
				promise.reject(new Error(error));
			}
			delete this.pending_requests[msg.request_id];
		}
		
		/* Receive message */
		for (var i=0; i<this.listeners.length; i++)
		{
			var listener = this.listeners[i];
			listener(event);
		}
	}
	
	
	/**
	 * Add listener
	 */
	addListener(listener)
	{
		this.listeners.push(listener);
	}
	
	
	/**
	 * Call api
	 */
	call(command, payload)
	{
		return new Promise((resolve, reject) => {
			var id = this.request_id + 1;
			this.request_id++;
			this.pending_requests[id] = {
				"resolve": resolve,
				"reject": reject,
			};
			this.layout.vscode.postMessage({
				"request_id": id,
				"command": command,
				"payload": payload,
			});
		});
	}
}

export default Api;