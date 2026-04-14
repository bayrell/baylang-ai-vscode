# API Documentation

## Overview

API is implemented as REST-like endpoints using `Curl` in BayLang. Each API call follows the format:

```
URL: http://host/api/{api_name}/{method_name}
Method: POST
Content-Type: application/json
Authorization: Bearer {token}
```

## Basic Usage Example

```bay
Map headers = {
    "Authorization": "Bearer token",
    "Content-Type": "application/json",
};

/* Create curl */
Curl curl = new Curl("http://localhost/api" ~ url, {
    "post": post,
    "headers": headers,
});
```

## API Modules

### 1. AI Chat (`ai.chat`)

#### Method: save
**Endpoint:** `POST /api/ai.chat/save`

**Description:** Save chat conversation

**Request Body:**
```json
{
    "key": "string",
    "name": "string",
    "messages": [
        {
            "id": "string",
            "role": "string",
            "content": "string"
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "chat_id": 123
    }
}
```

#### Method: delete
**Endpoint:** `POST /api/ai.chat/delete`

**Description:** Delete chat by key

**Request Body:**
```json
{
    "key": "chat_key"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "deleted": true
    }
}
```

### 2. AI Memory (`ai.memory`)

#### Method: add
**Endpoint:** `POST /api/ai.memory/add`

**Description:** Add memory record

**Request Body:**
```json
{
    "category": "string",
    "content": "string"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "item": {
            "id": 1,
            "category": "personal",
            "content": "Memory content",
            "gmtime_add": "2026-01-01 12:00:00"
        }
    }
}
```

**Note:** Category "soul" is reserved and cannot be used.

#### Method: save
**Endpoint:** `POST /api/ai.memory/save`

**Description:** Save memory record (update or create)

**Request Body:**
```json
{
    "category": "string",
    "content": "string"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "item": {
            "id": 1,
            "category": "personal",
            "content": "Memory content",
            "gmtime_add": "2026-01-01 12:00:00"
        }
    }
}
```

#### Method: read
**Endpoint:** `POST /api/ai.memory/read`

**Description:** Read memory by category

**Request Body:**
```json
{
    "category": "string"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "content": "Memory content 1\n\nMemory content 2"
    }
}
```

#### Method: readAll
**Endpoint:** `POST /api/ai.memory/readAll`

**Description:** Read all memory grouped by category

**Request Body:**
```json
{}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "items": {
            "personal": ["Memory 1", "Memory 2"],
            "work": ["Work memory 1"]
        }
    }
}
```

#### Method: delete
**Endpoint:** `POST /api/ai.memory/delete`

**Description:** Delete memory by ID

**Request Body:**
```json
{
    "id": 1
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1
    }
}
```

### 3. AI Notes (`ai.note`)

#### Method: save
**Endpoint:** `POST /api/ai.note/save`

**Description:** Save note

**Request Body:**
```json
{
    "id": 1,
    "title": "Note title",
    "content": "Note content",
    "file_name": "file.txt",
    "priority": "high",
    "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "item": {
            "id": 1,
            "title": "Note title",
            "content": "Note content",
            "priority": "high",
            "tags": ["tag1", "tag2"]
        }
    }
}
```

#### Method: get
**Endpoint:** `POST /api/ai.note/get`

**Description:** Get notes by IDs

**Request Body:**
```json
{
    "ids": [1, 2, 3]
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "items": [
            {
                "id": 1,
                "title": "Note title 1",
                "priority": "high"
            },
            {
                "id": 2,
                "title": "Note title 2",
                "priority": "medium"
            }
        ]
    }
}
```

#### Method: search
**Endpoint:** `POST /api/ai.note/search`

**Description:** Search notes with filters

**Request Body:**
```json
{
    "category": "personal",
    "tags": ["tag1", "tag2"],
    "query": "search text",
    "max_distance": 0.8,
    "page": 1,
    "limit": 20
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "items": [
            {
                "id": 1,
                "title": "Note title",
                "distance": 0.5,
                "priority": "high"
            }
        ],
        "total": 1
    }
}
```

#### Method: delete
**Endpoint:** `POST /api/ai.note/delete`

**Description:** Delete note by ID

**Request Body:**
```json
{
    "id": 1
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "deleted_id": 1
    }
}
```

### 4. AI Note Categories (`ai.note.category`)

#### Method: list
**Endpoint:** `POST /api/ai.note.category/search`

**Description:** Get list of categories

**Request Body:**
```json
{}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "items": [
            {
                "name": "personal",
                "description": "Personal notes"
            }
        ]
    }
}
```

#### Method: save
**Endpoint:** `POST /api/ai.note.category/save`

**Description:** Save category

**Request Body:**
```json
{
    "name": "personal",
    "description": "Personal notes"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "item": {
            "name": "personal",
            "description": "Personal notes"
        }
    }
}
```

#### Method: delete
**Endpoint:** `POST /api/ai.note.category/delete`

**Description:** Delete category by name

**Request Body:**
```json
{
    "name": "personal"
}
```

**Response:**
```json
{
    "success": true,
    "data": {}
}
```

### 5. AI Note Tags (`ai.note.tag`)

#### Method: list
**Endpoint:** `POST /api/ai.note.tag/search`

**Description:** Get list of tags

**Request Body:**
```json
{}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "items": [
            {
                "name": "tag1",
                "description": "Tag description"
            }
        ]
    }
}
```

#### Method: save
**Endpoint:** `POST /api/ai.note.tag/save`

**Description:** Save tag

**Request Body:**
```json
{
    "name": "tag1",
    "description": "Tag description"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "item": {
            "name": "tag1",
            "description": "Tag description"
        }
    }
}
```

#### Method: delete
**Endpoint:** `POST /api/ai.note.tag/delete`

**Description:** Delete tag by name

**Request Body:**
```json
{
    "name": "tag1"
}
```

**Response:**
```json
{
    "success": true,
    "data": {}
}
```

### 6. AI Journal (`ai.journal`)

#### Method: save
**Endpoint:** `POST /api/ai.journal/save`

**Description:** Save journal entry

**Request Body:**
```json
{
    "category": "info",
    "message": "Journal message"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "item": {
            "id": 1,
            "category": "info",
            "message": "Journal message",
            "gmtime_add": "2026-01-01 12:00:00"
        }
    }
}
```

## Authentication

All API requests require authentication via `Authorization` header with Bearer token:

```
Authorization: Bearer {token}
```

The token is validated through the `AuthMiddleware` which checks the `AccessToken` table.

## Error Handling

API errors are returned in the following format:

```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Error message"
    }
}
```

Common error codes:
- `ItemNotFound`: Resource not found
- `ApiError`: General API error
- `RuntimeException`: Runtime exception

## Implementation Details

### CoreApi Class
All API endpoints extend `CoreApi` which provides:
- User authentication via token
- User ID and Android ID extraction
- Initialization of services

### Service Layer
Business logic is encapsulated in service classes:
- `ChatService`: Chat management
- `MemoryService`: Memory management
- `NoteService`: Note management

### Database Transactions
Some operations (like note save and delete) use database transactions to ensure data consistency.

### Vector Search
Note search supports vector-based similarity search using embeddings:
- Cosine distance calculation
- Configurable distance threshold (`max_distance`)
- Integration with sentence embeddings provider
