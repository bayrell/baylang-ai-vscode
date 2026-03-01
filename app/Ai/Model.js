import { urlJoin } from "../lib.js";

export class Model
{
    constructor()
    {
        this.type = "";
        this.name = "";
        this.models = [];
        this.settings = {};
    }
    assign(data)
    {
        this.type = data.type;
        this.name = data.name;
        this.models = data.models;
        this.settings = data.settings;
    }
    getKey()
    {
        return this.settings["key"] || "";
    }
    getUrl()
    {
        return "";
    }
    async loadModels()
    {
    }
}


export class OpenAIModel extends Model
{
    getUrl(path)
    {
        var url = this.settings.url != "" ? this.settings.url : "https://api.openai.com/v1/";
        return urlJoin(url, path);
    }
    
    
    /**
     * Load models
     */
    async loadModels()
    {
        var url = this.getUrl("models");
        if (!url)
        {
            throw new Error("Url not found");
        }
        
        try
        {
            var response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + this.getKey(),
                    "Content-Type": "application/json"
                },
            });
            if (!response.ok)
            {
                throw new Error(await getErrorResponse(response));
            }
            
            var response_data = await response.json();
            var models = response_data.data;
            if (!models || !Array.isArray(models))
            {
                throw new Error("Models not found");
            }
            
            this.models = models;
        }
        catch (e)
        {
            throw e;
        }
    }
}


export class OpenRouterModel extends OpenAIModel
{
    getUrl(path)
    {
        return urlJoin("https://openrouter.ai/api/v1", path);
    }
}


export class GeminiModel extends OpenAIModel
{
    getUrl(path)
    {
        return urlJoin("https://generativelanguage.googleapis.com/v1beta/openai/", path);
    }
}


export class GrokModel extends OpenAIModel
{
    getUrl(path)
    {
        return urlJoin("https://api.x.ai/v1/", path);
    }
}


export class OllamaModel extends OpenAIModel
{
    getUrl(path)
    {
        if (this.settings.url == undefined) return "";
        return urlJoin(this.settings.url, path);
    }
}


export function createModel(data)
{
    var model = null;
    if (data.type == "gemini") model = new GeminiModel();
    else if (data.type == "openrouter") model = new OpenRouterModel();
    else if (data.type == "ollama") model = new OllamaModel();
    else if (data.type == "openai") model = new OpenAIModel();
    else if (data.type == "grok") model = new GrokModel();
    else model = new Model();
    model.assign(data);
    return model;
};