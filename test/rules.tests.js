import { minimatch } from "minimatch";
import { createRule, filterRules, PromptBuilder, Message, Rule } from "../app/ai.js";

describe("Rules", function(){
	
	it("One rule", function(){
		
		var rules = [
			createRule({
				name: "description",
				content: "Project description",
			})
		];
		
		var message = new Message([
			{
				block: "text",
				content: "Create simple project",
			}
		]);
		
		rules = filterRules(rules, message);
		
		var builder = new PromptBuilder("You are an AI programmer");
		var prompt = builder.getResult({
			"query": message.getText(),
			"rules": rules.map(rule => rule.content).join("\n\n"),
		});
		
		expect(prompt).toEqual([
			{ role: "system", content: "You are an AI programmer" },
			{ role: "system", content: "Project description" },
			{ role: "user", content: "Create simple project" },
		]);
	});
	
	it("File rule", function(){
		
		var rules = [
			createRule({
				name: "description",
				content: "Project description",
			}),
			createRule({
				name: "Text file style",
				rules: "*.txt",
				content: "Write documentation in text files",
			}),
			createRule({
				name: "Javascript code style",
				rules: "*.js",
				content: "Use best practice of JavaScript programming",
			}),
		];
		
		var message = new Message([
			{
				block: "text",
				content: "Create simple project on javascript",
			},
			{
				block: "textfile",
				filename: "app/main.js",
				content: "console.log('Hello world')",
			}
		]);
		
		rules = filterRules(rules, message);
		
		var builder = new PromptBuilder("You are an AI programmer");
		var prompt = builder.getResult({
			"query": message.getText(),
			"rules": rules.map(rule => rule.content).join("\n\n"),
		});
		
		expect(prompt).toEqual([
			{ role: "system", content: "You are an AI programmer" },
			{ role: "system", content: "Project description\n\n" +
				"Use best practice of JavaScript programming" },
			{ role: "user", content: "Create simple project on javascript\n\n" +
				"Filename: app/main.js\n" +
				"```console.log('Hello world')```"
			},
		]);
	});
	
	function matchRule(filename, rule)
	{
		if (Rule.match(filename, rule)) return true;
		return false;
		/*
		var regex = Rule.convertRule(rule);
		if (regex.test(filename)) return true;
		
		var regex = Rule.convertRule(rule, false);
		if (regex.test(filename)) return true;
		
		return false;*/
	}
	
	it("Test file", function(){
		expect(matchRule("file.txt", "*")).toBe(true);
	});
	
	it("Test file with directory", function(){
		expect(matchRule("dir/file.txt", "*")).toBe(true);
	});
	
	it("Test text file", function(){
		expect(matchRule("file.txt", "*.txt")).toBe(true);
	});
	
	it("Test image file", function(){
		expect(matchRule("image.png", "*.txt")).toBe(false);
	});
	
	it("Test app image file", function(){
		expect(matchRule("app/image.png", "*.png")).toBe(true);
	});
	
	it("Test app js files", function(){
		expect(matchRule("app/main.js", "app/*.js")).toBe(true);
	});
	
	it("Test app js subfiles", function(){
		expect(matchRule("app/sub/main.js", "app/*.js")).toBe(false);
	});
	
	it("Test app js allow subfiles", function(){
		expect(matchRule("app/sub/main.js", "app/**/*.js")).toBe(true);
	});
	
	it("Test project subfiles", function(){
		expect(matchRule("project/src/main.py", "project/**/*.py")).toBe(true);
	});
	
	it("Test project files", function(){
		expect(matchRule("project/main.py", "project/**/*.py")).toBe(true);
	});
	
	it("Test project js subfiles", function(){
		expect(matchRule("project/src/main.js", "project/**/*.py")).toBe(false);
	});
	
	it("Test document", function(){
		expect(matchRule("document.txt", "doc*")).toBe(true);
	});
	
	it("Test documents", function(){
		expect(matchRule("docs/readme.txt", "docs*")).toBe(false);
	});
	
	it("Test documents folder", function(){
		expect(matchRule("docs/readme.txt", "docs/*")).toBe(true);
	});
	
	it("ABC test", function(){
		expect(matchRule("a.b.c", "*.b.c")).toBe(true);
	});
	
	it("ABC test 2", function(){
		expect(matchRule("a_b_c", "a_b_*")).toBe(true);
	});
});