# Model Context Protocol (MCP) - Справочник

> **Версия спецификации**: 2026-07-28
> **Источник**: [modelcontextprotocol.io](https://modelcontextprotocol.io)

## Что такое MCP?

**Model Context Protocol (MCP)** — это открытый протокол для бесшовной интеграции LLM-приложений с внешними источниками данных и инструментами.

MCP стандартизирует способ подключения LLM к контексту, который им необходим,类似 как **Language Server Protocol (LSP)** стандартизировал поддержку языков программирования в IDE.

---

## Архитектура

### Участники протокола

```
┌─────────────────────────────────────────────────────────────┐
│                         HOST                                │
│  (LLM-приложение: IDE, чат-бот, AI-workflow)                │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Client 1  │  │   Client 2  │  │   Client N  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Server 1 │    │ Server 2 │    │ Server N │
    │(天气 API)│    │(文件系统)│    │(БД)      │
    └──────────┘    └──────────┘    └──────────┘
```

| Роль | Описание |
|------|----------|
| **Host** | LLM-приложение, инициирующее соединения (IDE, чат-бот) |
| **Client** | Коннектор внутри Host, обеспечивающий связь с Server |
| **Server** | Сервис, предоставляющий контекст и возможности (API, базы данных, инструменты) |

---

## Формат сообщений

MCP использует **JSON-RPC 2.0** для обмена сообщениями.

### Типы сообщений

```javascript
// 1. Request (запрос) - ожидает ответ
{
	"jsonrpc": "2.0",
	"id": "unique-request-id",
	"method": "tools/call",
	"params": {
		"_meta": {
			"io.modelcontextprotocol/protocolVersion": "2026-07-28",
			"io.modelcontextprotocol/clientInfo": {
				"name": "MyClient",
				"version": "1.0.0"
			},
			"io.modelcontextprotocol/clientCapabilities": {}
		},
		"name": "get_weather",
		"arguments": { "city": "Moscow" }
	}
}

// 2. Response (ответ - успех)
{
	"jsonrpc": "2.0",
	"id": "unique-request-id",
	"result": {
		"resultType": "complete",
		"content": [
			{
				"type": "text",
				"text": "Температура в Москве: 18°C"
			}
		]
	}
}

// 3. Response (ответ - ошибка)
{
	"jsonrpc": "2.0",
	"id": "unique-request-id",
	"error": {
		"code": -32602,
		"message": "Unknown tool: invalid_tool_name"
	}
}

// 4. Notification (уведомление) - не ожидает ответа
{
	"jsonrpc": "2.0",
	"method": "notifications/progress",
	"params": {
		"progressToken": "token-123",
		"progress": 50,
		"total": 100,
		"message": "Обработка..."
	}
}
```

---

## Возможности (Capabilities)

### Возможности Server

```javascript
{
	"tools": { "listChanged": true },       // Инструменты
	"resources": { 
		"subscribe": true,                   // Подписка на обновления
		"listChanged": true                  // Уведомления об изменении списка
	},
	"prompts": { "listChanged": true },     // Промпты
	"completions": {},                      // Автодополнение
	"extensions": {}                        // Расширения
}
```

### Возможности Client

```javascript
{
	"roots": {},           // Список корневых директорий (deprecated)
	"sampling": {},        // Семплинг LLM через клиент
	"elicitation": {       // Запрос данных у пользователя
		"form": {},        // Через форму
		"url": {}          // Через URL
	},
	"extensions": {}       // Расширения
}
```

---

## Основные функции сервера

### 1. Tools (Инструменты)

Функции, которые AI может вызывать для выполнения задач.

```javascript
// Запрос списка инструментов
{
	"method": "tools/list",
	"params": { "_meta": { ... } }
}

// Ответ со списком инструментов
{
	"result": {
		"resultType": "complete",
		"tools": [
			{
				"name": "get_weather",
				"title": "Получить погоду",
				"description": "Возвращает текущую погоду для города",
				"inputSchema": {
					"type": "object",
					"properties": {
						"city": {
							"type": "string",
							"description": "Название города"
						}
					},
					"required": ["city"]
				},
				"outputSchema": {
					"type": "object",
					"properties": {
						"temperature": { "type": "number" },
						"conditions": { "type": "string" }
					}
				},
				"annotations": {
					"readOnlyHint": true,
					"destructiveHint": false,
					"idempotentHint": true,
					"openWorldHint": true
				}
			}
		],
		"ttlMs": 3600000,
		"cacheScope": "public"
	}
}

// Вызов инструмента
{
	"method": "tools/call",
	"params": {
		"_meta": { ... },
		"name": "get_weather",
		"arguments": { "city": "Moscow" }
	}
}

// Результат вызова
{
	"result": {
		"resultType": "complete",
		"content": [
			{
				"type": "text",
				"text": "Температура: 18°C, облачно"
			}
		],
		"structuredContent": {
			"temperature": 18,
			"conditions": "облачно"
		},
		"isError": false
	}
}
```

### 2. Resources (Ресурсы)

Данные, доступные для чтения (файлы, БД, API).

```javascript
// Список ресурсов
{
	"method": "resources/list",
	"params": { "_meta": { ... } }
}

// Результат
{
	"result": {
		"resources": [
			{
				"uri": "file:///project/src/main.rs",
				"name": "main.rs",
				"title": "Главный файл",
				"description": "Точка входа приложения",
				"mimeType": "text/x-rust",
				"size": 1024
			}
		],
		"ttlMs": 600000,
		"cacheScope": "private"
	}
}

// Чтение ресурса
{
	"method": "resources/read",
	"params": {
		"uri": "file:///project/src/main.rs"
	}
}
```

### 3. Prompts (Промпты)

Шаблоны сообщений и workflow для пользователей.

```javascript
// Список промптов
{
	"method": "prompts/list",
	"params": { "_meta": { ... } }
}

// Получение промпта
{
	"method": "prompts/get",
	"params": {
		"name": "code_review",
		"arguments": {
			"code": "def hello():\n    print('world')"
		}
	}
}

// Результат
{
	"result": {
		"resultType": "complete",
		"description": "Промпт для ревью кода",
		"messages": [
			{
				"role": "user",
				"content": {
					"type": "text",
					"text": "Пожалуйста, проведи ревью этого Python кода:\ndef hello():\n    print('world')"
				}
			}
		]
	}
}
```

---

## Функции клиента

### 1. Elicitation (Получение данных у пользователя)

Сервер может запрашивать информацию у пользователя через клиент.

```javascript
// Запрос формы
{
	"method": "elicitation/create",
	"params": {
		"mode": "form",
		"message": "Пожалуйста, введите ваш GitHub username",
		"requestedSchema": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"title": "GitHub Username",
					"description": "Ваш GitHub username"
				}
			},
			"required": ["name"]
		}
	}
}

// Ответ пользователя
{
	"action": "accept",
	"content": {
		"name": "octocat"
	}
}
```

### 2. Sampling (Семплинг LLM)

Сервер может попросить клиент сгенерировать ответ через LLM.

```javascript
// Запрос семплинга
{
	"method": "sampling/createMessage",
	"params": {
		"messages": [
			{
				"role": "user",
				"content": {
					"type": "text",
					"text": "Какая столица Франции?"
				}
			}
		],
		"modelPreferences": {
			"hints": [{ "name": "claude-3-sonnet" }],
			"intelligencePriority": 0.8,
			"speedPriority": 0.5
		},
		"maxTokens": 100
	}
}

// Результат
{
	"role": "assistant",
	"content": {
		"type": "text",
		"text": "Столица Франции - Париж."
	},
	"model": "claude-3-sonnet-20240307",
	"stopReason": "endTurn"
}
```

---

## Кэширование

MCP поддерживает кэширование ответов для оптимизации производительности.

```javascript
{
	"result": {
		"resultType": "complete",
		"ttlMs": 600000,        // Время жизни кэша (мс)
		"cacheScope": "public"  // "public" или "private"
	}
}
```

| Поле | Описание |
|------|----------|
| `ttlMs` | Время жизни кэша в миллисекундах (0 = без кэширования) |
| `cacheScope` | `public` - можно кэшировать для всех, `private` - только для текущего контекста |

---

## Подписки (Subscriptions)

Клиент может подписаться на уведомления об изменениях.

```javascript
// Открытие канала подписки
{
	"method": "subscriptions/listen",
	"params": {
		"notifications": {
			"toolsListChanged": true,
			"promptsListChanged": true,
			"resourcesListChanged": true,
			"resourceSubscriptions": [
				"file:///project/config.json"
			]
		}
	}
}

// Уведомление об изменении списка инструментов
{
	"method": "notifications/tools/list_changed",
	"params": {}
}

// Уведомление об обновлении ресурса
{
	"method": "notifications/resources/updated",
	"params": {
		"uri": "file:///project/config.json"
	}
}
```

---

## Коды ошибок JSON-RPC

| Код | Описание |
|-----|----------|
| `-32700` | Parse Error - ошибка разбора JSON |
| `-32600` | Invalid Request - невалидный запрос |
| `-32601` | Method Not Found - метод не найден |
| `-32602` | Invalid Params - невалидные параметры |
| `-32603` | Internal Error - внутренняя ошибка |
| `-32020` | Header Mismatch - несоответствие заголовков |
| `-32021` | Missing Required Client Capability - отсутствует возможность клиента |
| `-32022` | Unsupported Protocol Version - неподдерживаемая версия протокола |

---

## Транспорты

### stdio (Стандартный ввод/вывод)

```
┌────────┐         ┌────────┐
│ Client │ ◄─────► │ Server │
│        │ stdin   │        │
│        │ stdout  │        │
└────────┘         └────────┘
```

### Streamable HTTP

```
┌────────┐         ┌────────┐
│ Client │ ◄─────► │ Server │
│        │  POST   │        │
│        │ ◄─────  │        │
│        │ events  │        │
└────────┘         └────────┘
```

---

## Пример интеграции с VSCode

```javascript
// Подключение MCP сервера в расширении VSCode
const mcpClient = new MCPClient({
	name: "MyVSCodeExtension",
	version: "1.0.0",
	capabilities: {
		elicitation: { form: {} }
	}
});

// Получение списка инструментов
const tools = await mcpClient.request("tools/list", {});

// Вызов инструмента
const result = await mcpClient.request("tools/call", {
	name: "get_weather",
	arguments: { city: "Moscow" }
});

// Подписка на изменения
await mcpClient.request("subscriptions/listen", {
	notifications: {
		toolsListChanged: true
	}
});
```

---

## Полезные ссылки

- [Спецификация MCP](https://modelcontextprotocol.io)
- [GitHub репозиторий](https://github.com/modelcontextprotocol/specification)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Python SDK](https://github.com/modelcontextprotocol/python-sdk)

---

## Краткая шпаргалка

| Действие | Метод |
|----------|-------|
| Узнать возможности сервера | `server/discover` |
| Получить список инструментов | `tools/list` |
| Вызвать инструмент | `tools/call` |
| Получить список ресурсов | `resources/list` |
| Прочитать ресурс | `resources/read` |
| Получить список промптов | `prompts/list` |
| Получить промпт | `prompts/get` |
| Запросить данные у пользователя | `elicitation/create` |
| Попросить LLM сгенерировать ответ | `sampling/createMessage` |
| Подписаться на уведомления | `subscriptions/listen` |
| Отменить запрос | `notifications/cancelled` |
| Прогресс выполнения | `notifications/progress` |
