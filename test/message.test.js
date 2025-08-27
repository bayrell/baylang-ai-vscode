import { Message, MessageItem } from "../app/ai.js";

describe("Messages", function(){
	it("One line test", function(){
		var message = new Message();
		message.addChunk("Test");
		var data = message.getData().content;
		expect(data).toEqual([
			{ block: "text", content: "Test" },
		]);
	});
	it("Two lines", function(){
		var message = new Message();
		message.addChunk("Line1\nLine2");
		var data = message.getData().content;
		expect(data).toEqual([
			{ block: "text", content: "Line1" },
			{ block: "text", content: "Line2" },
		]);
	});
	it("Code", function(){
		var message = new Message();
		message.addChunk("Line1\n");
		message.addChunk("```javascript\nvar a = 1;\n```");
		message.trim();
		var data = message.getData().content;
		expect(data).toEqual([
			{ block: "text", content: "Line1" },
			{ block: "code", content: "var a = 1;", language: "javascript" },
		]);
	});
	it("Code simple", function(){
		var message = new Message();
		message.addChunk("```\n");
		message.addChunk("var a = 1;\n");
		message.addChunk("```");
		message.trim();
		var data = message.getData().content;
		expect(data).toEqual([
			{ block: "code", content: "var a = 1;", language: "" },
		]);
	});
	it("Code multiline", function(){
		var message = new Message();
		message.addChunk("Line1\n```javascript\n");
		message.addChunk("var a = 1;\n");
		message.addChunk("```");
		message.trim();
		var data = message.getData().content;
		expect(data).toEqual([
			{ block: "text", content: "Line1" },
			{ block: "code", content: "var a = 1;", language: "javascript" },
		]);
	});
});