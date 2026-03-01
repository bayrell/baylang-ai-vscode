import { createHash } from "crypto";
import { promises as fs } from "fs";

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