import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const file_types = {
	// Web technologies
	"html": "text/html",
	"htm": "text/html",
	"css": "text/css",
	"js": "application/javascript",
	"json": "application/json",
	"ts": "application/typescript",
	"tsx": "application/typescript", // For React TypeScript
	"jsx": "application/javascript", // For React JavaScript
	"xml": "application/xml",
	"svg": "image/svg+xml",
	"yml": "application/x-yaml",
	"yaml": "application/x-yaml",
	"vue": "text/x-vue", // Common for Vue.js single file components
	"ejs": "text/html", // Embedded JavaScript templates

	// Programming languages
	"php": "application/x-php", // More specific for PHP
	"py": "text/x-python",
	"java": "text/x-java-source",
	"bay": "text/plain",
	"c": "text/x-csrc",
	"cpp": "text/x-c++src",
	"h": "text/x-chdr",
	"hpp": "text/x-c++hdr",
	"go": "text/x-go",
	"rb": "text/x-ruby",
	"pl": "text/x-perl",
	"sh": "application/x-sh", // Shell script
	"swift": "text/x-swift",
	"kt": "text/x-kotlin",
	"rs": "text/x-rustsrc",
	"lua": "text/x-lua",
	"sql": "application/sql",
	"r": "text/x-r",
	"cs": "text/x-csharp",
	"fs": "text/x-fsharp",
	"vb": "text/x-vb", // Visual Basic

	// Markdown and documentation
	"md": "text/markdown",
	"markdown": "text/markdown",
	"txt": "text/plain",

	// Image types
	"png": "image/png",
	"jpg": "image/jpeg",
	"jpeg": "image/jpeg",
	"gif": "image/gif",
	"webp": "image/webp",
	"ico": "image/x-icon",

	// Font types
	"woff": "font/woff",
	"woff2": "font/woff2",
	"ttf": "font/ttf",
	"otf": "font/otf",
	"eot": "application/vnd.ms-fontobject",

	// Archives and general binaries
	"zip": "application/zip",
	"tar": "application/x-tar",
	"gz": "application/gzip",
	"pdf": "application/pdf",
	"doc": "application/msword",
	"docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"xls": "application/vnd.ms-excel",
	"xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"ppt": "application/vnd.ms-powerpoint",
	"pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",

	// Generic/fallback for unknown text types
	"log": "text/plain",
	"cfg": "text/plain",
	"ini": "text/plain",
	"env": "text/plain",
	"gitignore": "text/plain",
	"editorconfig": "text/plain",
	"license": "text/plain",
	"htaccess": "text/plain"
};

export function makeHash(item)
{
	return createHash('md5').update(item).digest('hex');
}

export async function fileExists(file_path)
{
	try
	{
		await fs.access(file_path);
		return true;
	}
	catch
	{
		return false;
	}
}

export async function makeFilePath(file_name)
{
	const dir_name = path.dirname(file_name);
	await fs.mkdir(dir_name, { recursive: true });
}

export async function getFileType(file_path)
{
	const file_extension = path.extname(file_path).substring(1);
	if (file_types[file_extension]) return file_types[file_extension];
	return "text/plain";
}

export function isImage(mime)
{
	const mime_types = [
		"image/png",
		"image/jpeg",
		"image/gif",
		"image/webp",
		"image/x-icon"
	];
	return mime_types.indexOf(mime) >= 0;
}

export function isTextFile(file)
{
	const mime_types = [
		"application/json",
		"application/xml",
		"application/javascript",
		"application/typescript",
		"text/plain",
		"text/html",
		"text/css",
		"text/markdown"
	];
	if (mime_types.indexOf(file.mime) >= 0) return true;
	if (file.name.indexOf("text/") == 0) return true;
	
	const extensions = [
		"txt", "html", "htm", "css", "js", "json", "ts", "tsx", "jsx", "xml", "svg", "yml", "yaml", "vue", "ejs", "php", "py", "java", "bay", "c", "cpp", "h", "hpp", "go", "rb", "pl", "sh", "swift", "kt", "rs", "lua", "sql", "r", "cs", "fs", "vb", "log", "cfg", "ini", "env", "gitignore", "editorconfig", "license"
	];
	const file_extension = path.extname(file.name)
		.substring(1);
	if (extensions.indexOf(file_extension) >= 0) return true;
	
	return false;
}