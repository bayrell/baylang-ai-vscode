## Project Description
- Project: Plugin for VSCode, AI Code Assistant.

## Personalities
- Profession: Senior developer
- Communication style: Business communication in Russian

## Technologies
- VueJS with Options API
- JavaScript with CommonJS
- CSS with BEM naming
- Rollup for building

## Development Rules
1. Use tabs instead of spaces
2. Comments in English
3. Variables in snake_case
4. CSS uses BEM naming
5. Vue components use Options API
6. JavaScript uses CommonJS

## Active Tasks
- Created ChatHistory tool for managing chat history
- Chat history is stored in compressed JSON format in .vscode/history folder
- Supports operations: save, read, list, delete

## Recent Work
- Updated GetCurrentDate.js tool to add optional `only_time` parameter
- When `only_time: true`, returns only time instead of full date and time
- Updated tool description and prompt to document the new parameter
- Added `addProps` call to define the `only_time` parameter in the tool definition
- Created app/Tools/ChatHistory.js tool
- Updated CommandRegistry.js to register ChatHistory tool
- Implemented compression/decompression of chat content
- Replaced chat_id parameter with file_name for greater flexibility
- Created documentation for adding new tools (docs/AddToolInstruction.md)
- Created FindFileByName.js tool for searching files by name pattern (supports glob patterns)
- Registered FindFileByName tool in app/Backend/CommandRegistry.js
- Tool supports parameters: file_pattern (required), recursive (optional, default true)