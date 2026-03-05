import path from "path";

/**
 * Resolve file
 */
export function resolve(file_path, workspace_path)
{
	const absolute_file_path = path.join(workspace_path, file_path);
	const resolve_path = path.resolve(absolute_file_path);
	if (!resolve_path.startsWith(workspace_path + path.sep))
	{
		throw new Error("Attempted to write outside the workspace folder. Path: " + file_path);
	}
	return resolve_path;
}

/**
 * Recursively reads directory contents.
 */
export async function readDirRecursive(
	file_list, current_path, relative_base_path, recursive
)
{
	const entries = await fs.readdir(current_path, { withFileTypes: true });
	
	for (const entry of entries)
	{
		const full_entry_path = path.join(current_path, entry.name);
		const relative_entry_path = path.join(relative_base_path, entry.name);
		
		if (entry.isDirectory())
		{
			/* Add a trailing slash for directories */
			file_list.push(`${relative_entry_path}/`);
			if (recursive)
			{
				await readDirRecursive(file_list, full_entry_path, relative_entry_path);
			}
		}
		else if (entry.isFile())
		{
			file_list.push(relative_entry_path);
		}
	}
};