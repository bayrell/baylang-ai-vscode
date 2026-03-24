import { promises as fs } from "fs";
import { getFileType, isTextFile, isImage, fileExists } from "../api";

export class FileResult
{
	constructor()
	{
		this.path = "";
		this.name = "";
		this.content = null;
		this.readed = false;
		this.error = false;
		this.virtual = false;
		this.mime = "application/octet-stream";
	}
	
	
	/**
	 * Assign data
	 */
	assignData(data)
	{
		if (data.path) this.path = data.path;
		if (data.name) this.name = data.name;
		if (data.isDirectory) this.isDirectory = data.isDirectory;
		if (data.content) this.content = data.content;
		if (data.readed) this.readed = data.readed;
		if (data.error) this.error = data.error;
		if (data.mime) this.mime = data.mime;
	}
	
	
	/**
	 * Returns if text file
	 */
	isText()
	{
		return isTextFile(this);
	}
	
	
	/**
	 * Returns if file is image
	 */
	isImage()
	{
		return isImage(this.mime);
	}
	
	
	/**
	 * Returns file content
	 */
	getContent()
	{
		if (!this.readed || this.error) return "";
		if (this.isText())
		{
			return "Filename: " + this.name + "\n```" + this.content.toString("utf8") + "```";
		}
		const base64Content = this.content.toString("base64");
		return "data:" + this.mime + ";base64," + base64Content;
	}
	
	
	/**
	 * Read file
	 */
	async read()
	{
		try
		{
			this.mime = await getFileType(this.path);
			this.content = await fs.readFile(this.path);
			this.readed = true;
			this.error = false;
		}
		catch (error)
		{
			this.error = error;
		}
	}
}