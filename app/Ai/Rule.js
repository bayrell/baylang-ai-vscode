import { minimatch } from "minimatch";
import { splitItem } from "../lib.js";

export class Rule
{
	constructor()
	{
		this.name = "";
		this.description = "";
		this.disable = false;
		this.global = false;
		this.groups = "";
		this.rules = "";
		this.content = "";
		this.keywords = "";
	}
	
	
	/**
	 * Assign
	 */
	assign(item)
	{
		this.name = item.name || "";
		this.description = item.description || "";
		this.disable = item.disable || false;
		this.global = item.global || false;
		this.groups = item.groups || "";
		this.rules = item.rules || "";
		this.content = item.content;
		this.keywords = item.keywords || "";
	}
	
	
	/**
	 * Get data
	 */
	getData()
	{
		return {
			name: this.name,
			description: this.description,
			disable: this.disable,
			global: this.global,
			groups: this.groups,
			rules: this.rules,
			content: this.content,
			keywords: this.keywords,
		};
	}
	
	
	/**
	 * Convert rule to regexp
	 */
	static convertRule(rule, subfolder=true)
	{
		if (rule == "*") return new RegExp("^.*$");
		var pattern = rule.replace(new RegExp("[.+^${}()|[\]\\]", "g"), "\\$&");
		if (subfolder) pattern = pattern.replace(new RegExp("\\*\\*", "g"), ".*");
		else pattern = pattern.replace(new RegExp("\\*\\*\/", "g"), "");
		pattern = pattern.replace(new RegExp("\\*", "g"), "[^/]*");
		return new RegExp("^" + pattern + "$");
	}
	
	
	/**
	 * Match rule
	 */
	static match(filename, rule)
	{
		if (minimatch(filename, rule, { matchBase: true })) return true;
		return false;
	}
	
	
	/**
	 * Match file
	 */
	matchFile(filename)
	{
		var rules = splitItem(this.rules);
		for (var rule of rules)
		{
			if (this.constructor.match(filename, rule)) return true;
		}
		return false;
	}
	
	
	/**
	 * Parse content
	 */
	parseContent(content)
	{
		this.rules = "";
		this.description = "";
		this.global = false;
		this.keywords = "";
		
		var match = content.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
		if (!match)
		{
			this.content = content;
			return;
		}
		
		var lines = match[1].split("\n");
		this.content = match[2].trim();
		
		const readLine = (line, key) =>
		{
			var value = key;
			if (key == "alwaysApply") key = "global";
			else if (key == "globs") key = "rules";
			var match = line.match(new RegExp("^" + value + ":\s*(.*)$", "i"));
			if (match)
			{
				this[key] = match[1].trim();
				return true;
			}
			return false;
		};
		
		for (var line of lines)
		{
			line = line.trim();
			if (!line) continue;
			
			if (readLine(line, "description")) continue;
			if (readLine(line, "globs")) continue;
			if (readLine(line, "groups")) continue;
			if (readLine(line, "alwaysApply")) continue;
			if (readLine(line, "keywords")) continue;
			if (readLine(line, "disable")) continue;
		}
		
		this.disable = this.disable == "true";
		this.global = this.global == "true";
	}
	
	
	/**
	 * Returns content
	 */
	getContent()
	{
		var content = [
			"---"
		];
		if (this.description.length > 0)
		{
			content.push("description: " + this.description);
		}
		if (this.disable)
		{
			content.push("disable: true");
		}
		if (this.rules.length > 0)
		{
			content.push("globs: " + this.rules);
		}
		if (this.groups.length > 0)
		{
			content.push("groups: " + this.groups);
		}
		if (this.global)
		{
			content.push("alwaysApply: true");
		}
		if (this.keywords && this.keywords.length > 0)
		{
			content.push("keywords: " + this.keywords);
		}
		if (content.length > 1)
		{
			content.push("---");
			content.push("");
		}
		else content = [];
		content.push(this.content);
		return content.join("\n");
	}
	
	
	/**
	 * Returns rule content
	 */
	getRuleContent()
	{
		if (!this.description) return this.content;
		return this.description + "\n\n" + this.content;
	}
}


/**
 * Create rule
 */
export function createRule(item)
{
	var rule = new Rule();
	rule.assign(item)
	return rule;
}


/**
 * Returns true if file matching
 */
export function ruleMatching(rule, question)
{
	if (rule.disable) return false;
	if (rule.global) return true;
	if (rule.rules)
	{
		for (var item of question.files)
		{
			if (rule.matchFile(item.name)) return true;
		}
	}
	if (rule.keywords)
	{
		var content = question.user_message.getText().toLowerCase();
		var keywords = splitItem(rule.keywords);
		for (var item of keywords)
		{
			if (content.indexOf(item) >= 0) return true;
		}
	}
	return false;
}


/**
 * Filter rules
 */
export function filterRules(rules, question)
{
	return rules.filter(rule => {
		return ruleMatching(rule, question);
	});
}