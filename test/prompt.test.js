import { PromptBuilder } from "../app/ai.js";

describe("Test prompt", function(){
	it("1", function(){
		var builder = new PromptBuilder("You are an AI programmer");
		var prompt = builder.getResult({
			"query": "Write hello world program in JavaScript",
			"history": "",
		});
		expect(prompt).toEqual([
			{ role: "system", content: "You are an AI programmer" },
			{ role: "user", content: "Write hello world program in JavaScript" },
		]);
	});
});