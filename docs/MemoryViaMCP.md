# Memory via MCP — Architecture

## Goals

1. **Remove local memory tools** (`DeleteMemory`, `ReadMemory`, `UpdateMemory`) — they will be replaced by MCP server tools.
2. **Keep `MemoryService`** — it continues to sync chat history and journal with the backend API (persistence layer).
3. **Search through memory via MCP** — MCP server provides `memory_search` tool.
4. **Distinguish agents** — since MCP server is shared, we need to route requests to the correct agent's data.
5. **Auto-discovery** — `discovery` middleware runs before each request, no tool needed.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  VSCode Extension (Client)                              │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Question.js  │  │ MemoryService│  │ MCPServer    │  │
│  │ (middleware)  │  │ (API sync)   │  │ (tools)      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         │ discovery()     │ sendApi()        │ callTool()│
│         ▼                 ▼                  ▼          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Backend API  │  │ Backend API  │  │ MCP Server   │  │
│  │ /discovery   │  │ /ai.chat     │  │ /memory_*)   │  │
│  │ /ai.memory   │  │ /ai.journal  │  │ (shared)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Agent Identification

Since MCP server is shared across all agents, we need a way to identify which agent is making the request. Two approaches:

### Option A: `x-mcp-header` (Recommended)

Use MCP protocol's `x-mcp-header` extension. This maps tool parameters to HTTP headers.

**Tool definition:**
```json
{
  "name": "memory_search",
  "description": "Search through agent memory by query",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_id": {
        "type": "string",
        "description": "Agent identifier",
        "x-mcp-header": "X-Agent-Id"
      },
      "category": {
        "type": "string",
        "description": "Memory category to search in"
      },
      "query": {
        "type": "string",
        "description": "Search query"
      }
    },
    "required": ["agent_id", "query"]
  }
}
```

**How it works:**
1. Client sends `tools/call` with `agent_id: "assistant_001"`
2. MCP server receives header `X-Agent-Id: assistant_001`
3. Server routes query to correct agent's memory

**Client implementation:**
```javascript
// MCPServer.js - sendRequestHTTP()
async sendRequestHTTP(request, agentId) {
    var headers = {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2026-07-28",
    };
    // Inject agent_id into tool arguments
    if (request.method === "tools/call" && agentId) {
        request.params.arguments = request.params.arguments || {};
        request.params.arguments.agent_id = agentId;
    }
    var response = await fetch(this.url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(request),
    });
    return await response.json();
}
```

### Option B: Per-Agent MCP Connections

Each agent gets its own MCP server connection with different credentials:

```javascript
// MCPServerManager.js
getServerForAgent(agent) {
    // Each agent has its own MCP config
    return this.servers.find(s => s.agent_id === agent.id);
}
```

**Problem:** More connections, more resources. Not ideal for many agents.

### Option C: Custom Headers in `sendRequestHTTP`

Add agent info directly in MCP request headers (before protocol level):

```javascript
async sendRequestHTTP(request, agent) {
    var response = await fetch(this.url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "MCP-Protocol-Version": "2026-07-28",
            "X-Agent-Id": agent.id,
            "X-Agent-Global": agent.global ? "true" : "false",
        },
        body: JSON.stringify(request),
    });
    return await response.json();
}
```

**Note:** This is not part of MCP spec but works for Streamable HTTP transport.

## Recommended Approach

**Use Option A (`x-mcp-header`)** because:
- It's part of the MCP spec
- Works with any transport (HTTP, stdio)
- Clean separation of concerns
- Server can validate and route without parsing body

## MCP Tools for Memory

### 1. `memory_search`

Search through agent memory with optional category filter.

```json
{
  "name": "memory_search",
  "description": "Search through agent memory. Returns matching entries.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_id": {
        "type": "string",
        "description": "Agent identifier for routing",
        "x-mcp-header": "X-Agent-Id"
      },
      "query": {
        "type": "string",
        "description": "Search query (supports natural language)"
      },
      "category": {
        "type": "string",
        "description": "Optional category filter (e.g., 'system', 'user', 'project')"
      },
      "limit": {
        "type": "integer",
        "description": "Max results to return (default: 10)"
      }
    },
    "required": ["agent_id", "query"]
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 3 results:\n\n1. [system] User prefers dark theme\n2. [project] API uses REST endpoints\n3. [user] Birthday is 1996-05-15"
    }
  ]
}
```

### 2. `memory_read`

Read full memory content by category.

```json
{
  "name": "memory_read",
  "description": "Read full memory content by category",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_id": {
        "type": "string",
        "description": "Agent identifier for routing",
        "x-mcp-header": "X-Agent-Id"
      },
      "category": {
        "type": "string",
        "description": "Memory category to read"
      }
    },
    "required": ["agent_id", "category"]
  }
}
```

### 3. `memory_save`

Save or update memory entry.

```json
{
  "name": "memory_save",
  "description": "Save or update memory entry",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_id": {
        "type": "string",
        "description": "Agent identifier for routing",
        "x-mcp-header": "X-Agent-Id"
      },
      "category": {
        "type": "string",
        "description": "Memory category"
      },
      "content": {
        "type": "string",
        "description": "Memory content to save"
      },
      "command": {
        "type": "string",
        "description": "'save' to overwrite, 'append' to add"
      }
    },
    "required": ["agent_id", "category", "content"]
  }
}
```

### 4. `memory_delete`

Delete memory entry.

```json
{
  "name": "memory_delete",
  "description": "Delete memory entry by category",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_id": {
        "type": "string",
        "description": "Agent identifier for routing",
        "x-mcp-header": "X-Agent-Id"
      },
      "category": {
        "type": "string",
        "description": "Memory category to delete"
      }
    },
    "required": ["agent_id", "category"]
  }
}
```

## What Stays Local (MemoryService)

`MemoryService` continues to handle:

1. **Chat sync** — `saveChat()` saves conversation to backend API
2. **Journal** — `ai.journal/save` saves events
3. **Discovery** — `discovery()` loads context memory for prompt

These are NOT exposed as MCP tools because:
- They are middleware (auto-called, not LLM-controlled)
- They need direct API access with agent's token
- They are part of the client-side pipeline

## Migration Plan

### Step 1: Add `agent_id` to MCPServerTool

```javascript
// MCPServerTool.js
constructor(server, toolDef, agent) {
    super();
    this.agent = agent;
    // ... existing code
}

async execute(params, question) {
    // Inject agent_id from question.agent
    params.agent_id = question.agent.id;
    return await this.server.callTool(this.toolDef.name, params);
}
```

### Step 2: Update MCPServerManager

```javascript
// MCPServerManager.js
getToolsForAgent(agent) {
    return this.tools.map(tool => {
        tool.agent = agent;
        return tool;
    });
}
```

### Step 3: Remove Local Memory Tools

Delete:
- `app/Tools/Memory/DeleteMemory.js`
- `app/Tools/Memory/ReadMemory.js`
- `app/Tools/Memory/UpdateMemory.js`

Update `Question.js` to not register these tools.

### Step 4: MCP Server Implementation

The MCP server needs to:
1. Parse `X-Agent-Id` header from request
2. Route to correct agent's memory store
3. Return results

Example (BayLang):
```bay
/* MCP Server - Tool handler */
Map handleMemorySearch(Map params) {
    String agentId = params["agent_id"];
    String query = params["query"];
    String category = params["category"];
    
    /* Query agent's memory store */
    var results = this.memoryStore.search(agentId, query, category);
    
    return {
        "content": [{
            "type": "text",
            "text": this.formatResults(results)
        }]
    };
}
```

## Server-Side: Agent Routing

The MCP server maintains a mapping:

```javascript
// MCP Server
const agentMemoryStore = {
    "agent_001": {
        personal: ["User likes coffee", "Birthday: 1996"],
        system: ["Theme: dark", "Language: ru"],
    },
    "agent_002": {
        personal: ["Different user data"],
    }
};
```

Or it can proxy to backend API:

```javascript
async function handleMemorySearch(agentId, query) {
    // Call backend API with agent's credentials
    const response = await fetch(BACKEND_URL + "/api/ai.memory/search", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + getAgentToken(agentId),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
    });
    return response.json();
}
```

## Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| `memory_search` | MCP Server | Search memory (LLM-controlled) |
| `memory_read` | MCP Server | Read full memory (LLM-controlled) |
| `memory_save` | MCP Server | Save memory (LLM-controlled) |
| `memory_delete` | MCP Server | Delete memory (LLM-controlled) |
| `discovery()` | MemoryService | Load context for prompt (middleware) |
| `saveChat()` | MemoryService | Sync chat to API (middleware) |
| `agent_id` | `x-mcp-header` | Route to correct agent |
