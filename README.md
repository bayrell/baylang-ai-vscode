# BayLang AI - Your Smart Coding Assistant for VSCode

BayLang AI is an intelligent chatbot extension for Visual Studio Code designed to supercharge your programming workflow. It acts as your personal coding companion, providing instant help with code explanations, refactoring suggestions, code generation, and much more, directly within your IDE.

## Video Tutorial

Watch a detailed video guide on how the BayLang AI plugin works and how to set it up:
[https://www.youtube.com/watch?v=nUmrfqJsV_8](https://www.youtube.com/watch?v=nUmrfqJsV_8)

## Features

*   **Multi-Provider Support**: Seamlessly integrate with popular AI services like Google Gemini, OpenAI, Grok, and Ollama.
*   **Local AI Models with Ollama**: Leverage the power of local AI models via Ollama for enhanced privacy, offline capabilities, and customizable AI experiences.
*   **Code Generation**: Get boilerplate code, functions, or entire snippets generated based on your specifications.
*   **Code Explanation**: Understand complex code sections quickly with clear, concise explanations.
*   **Code Refactoring**: Receive intelligent suggestions to improve your code's structure, readability, and performance.
*   **Context-Aware Assistance**: The AI can understand the context of your current file or selection to provide more relevant answers.
*   **Interactive Chat Interface**: A dedicated chat panel within VSCode for easy interaction.
*   **Configurable Agents and Models**: Add and manage multiple AI agents, models, and custom rules directly within the extension's settings.

## Installation

1.  Open VSCode.
2.  Go to the Extensions view by clicking on the Square icon on the Side Bar or pressing `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS).
3.  Search for "BayLang AI".
4.  Click "Install".

## Usage

After installation, you can access BayLang AI in the VSCode Activity Bar. Look for the BayLang AI icon.

### Commands

BayLang AI provides the following commands to manage your experience:

*   **`BayLang AI: Show chat`**: Opens the BayLang AI chat panel where you can interact with the AI. You can find this command in the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) or by clicking the chat icon in the BayLang AI view title bar.
*   **`BayLang AI: Show settings`**: Opens the BayLang AI settings panel, allowing you to configure your AI provider (Gemini, OpenAI, Ollama, Grok), API keys, add your own agents and models, and define rules for your development project. You can find this command in the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) or by clicking the gear icon in the BayLang AI view title bar.

### Configuration

To use the AI features, you will need to configure API keys for selected providers (Gemini, OpenAI, Grok) or specify the Ollama endpoint if you are using local models.

All settings, including API keys, adding new AI agents, models, and rules for your project, are done directly within the extension's interface. To do this:

1.  Execute the **`BayLang AI: Show settings`** command (via the command palette or by clicking the gear icon in the BayLang AI panel).
2.  In the opened panel, you will find options to configure your preferences.

## Contributing

We welcome your contributions! If you have suggestions, bug reports, or want to contribute code, please visit our [GitHub repository](https://github.com/bayrell/baylang-ai-vscode).

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](https://github.com/bayrell/baylang-ai-vscode/blob/main/LICENSE) file for details.