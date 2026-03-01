import { minimatch } from "minimatch";

export class Rule
{
    constructor()
    {
        this.name = "";
        this.description = "";
        this.rules = "";
        this.content = "";
    }
    
    
    /**
     * Assign
     */
    assign(item)
    {
        this.name = item.name || "";
        this.description = item.description || "";
        this.rules = item.rules || "";
        this.content = item.content;
    }
    
    
    /**
     * Get data
     */
    getData()
    {
        return {
            name: this.name,
            description: this.description,
            rules: this.rules,
            content: this.content,
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
        var rules = this.getRules();
        for (var rule of rules)
        {
            if (this.constructor.match(filename, rule)) return true;
        }
        return false;
    }
    
    
    /**
     * Returns rules
     */
    getRules()
    {
        return this.rules.split(",").map(g => g.trim()).filter(g => g.length > 0);
    }
    
    
    /**
     * Parse content
     */
    parseContent(content)
    {
        this.rules = "";
        this.description = "";
        
        var match = content.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
        if (!match)
        {
            this.content = content;
            return;
        }
        
        var lines = match[1].split("\n");
        this.content = match[2].trim();
        
        for (var line of lines)
        {
            line = line.trim();
            if (!line) continue;
            
            var description = line.match(/^description:\s*(.*)$/i);
            if (description)
            {
                this.description = description[1].trim();
                continue;
            }
            
            var rules = line.match(/^globs:\s*(.*)$/i);
            if (rules)
            {
                this.rules = rules[1].trim();
                continue;
            }
        }
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
        if (this.rules.length > 0)
        {
            content.push("globs: " + this.rules);
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
export function ruleMatching(rule, files)
{
    if (!rule.rules) return true;
    for (var item of files)
    {
        if (rule.matchFile(item.filename)) return true;
    }
    return false;
}


/**
 * Filter rules
 */
export function filterRules(rules, message)
{
    return rules.filter(rule => {
        return ruleMatching(rule, message);
    });
}