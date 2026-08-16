# API Specification

Base path: `/api`  
All requests and responses use `Content-Type: application/json`.

---

## Types

### Task

| Field          | Type             | Description                              |
|----------------|------------------|------------------------------------------|
| `id`           | `string` (UUID)  | Unique identifier, generated on create.  |
| `title`        | `string`         | Short display name.                      |
| `description`  | `string`         | Optional longer description.             |
| `start_date`   | `string \| null` | ISO 8601 date string or `null`.          |
| `end_date`     | `string \| null` | ISO 8601 date string or `null`.          |
| `status`       | `TaskStatus`     | See below.                               |
| `project_id`   | `string \| null` | Optional project association.            |
| `owner_id`     | `string \| null` | Optional owner association.              |
| `created_date` | `string`         | ISO 8601 timestamp, set on create.       |
| `updated_date` | `string`         | ISO 8601 timestamp, updated on every write. |

### TaskStatus

| Value        | Description                                   |
|--------------|-----------------------------------------------|
| `pending`    | Not yet started. Default for new tasks.       |
| `in_progress`| Actively being worked on.                     |
| `completed`  | Done.                                         |
| `deleted`    | Soft-deleted. Not returned by default.        |

### Error Response

```json
{ "error": "Human-readable message" }
```

---

## Endpoints

### Health

#### `GET /api/health`

Returns server status.

**Response `200`**
```json
{ "status": "ok" }
```

---

### Tasks

#### `GET /api/tasks`

Returns all active (non-deleted) tasks. Use query parameters to filter.

**Query Parameters**

| Parameter        | Type      | Description                                        |
|------------------|-----------|----------------------------------------------------|
| `include_deleted`| `boolean` | Pass `true` to include soft-deleted tasks.         |
| `owner_id`       | `string`  | Filter to tasks with this `owner_id`.              |
| `project_id`     | `string`  | Filter to tasks with this `project_id`.            |

**Response `200`**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "",
    "start_date": null,
    "end_date": "2026-08-20",
    "status": "pending",
    "project_id": null,
    "owner_id": null,
    "created_date": "2026-08-16T10:00:00.000Z",
    "updated_date": "2026-08-16T10:00:00.000Z"
  }
]
```

---

#### `POST /api/tasks`

Creates a new task.

**Request Body**

| Field         | Type             | Required | Description                                        |
|---------------|------------------|----------|----------------------------------------------------|
| `title`       | `string`         | Yes      | Must be non-empty after trimming whitespace.       |
| `description` | `string`         | No       | Defaults to `""`.                                  |
| `start_date`  | `string \| null` | No       | ISO 8601 date string. Defaults to `null`.          |
| `end_date`    | `string \| null` | No       | ISO 8601 date string. Defaults to `null`.          |
| `status`      | `TaskStatus`     | No       | Excludes `"deleted"`. Defaults to `"pending"`.     |
| `project_id`  | `string \| null` | No       | Defaults to `null`.                                |
| `owner_id`    | `string \| null` | No       | Defaults to `null`.                                |

**Response `201`** — the created Task object.

**Error Responses**

| Status | Condition              |
|--------|------------------------|
| `400`  | Body is invalid JSON.  |
| `400`  | `title` is missing or blank. |

---

#### `GET /api/tasks/:id`

Returns a single active task by ID.

**Response `200`** — the Task object.

**Error Responses**

| Status | Condition                                  |
|--------|--------------------------------------------|
| `404`  | Task not found or is soft-deleted.         |

---

#### `PATCH /api/tasks/:id`

Partially updates a task. All fields are optional; omitted fields are left unchanged.

Passing an explicit `null` for `start_date`, `end_date`, `project_id`, or `owner_id` clears the field.

**Request Body**

| Field         | Type             | Description                                      |
|---------------|------------------|--------------------------------------------------|
| `title`       | `string`         | Must be non-empty after trimming.                |
| `description` | `string`         |                                                  |
| `start_date`  | `string \| null` | `null` clears the field.                         |
| `end_date`    | `string \| null` | `null` clears the field.                         |
| `status`      | `TaskStatus`     | Excludes `"deleted"`. Use `DELETE` to delete.    |
| `project_id`  | `string \| null` | `null` clears the field.                         |
| `owner_id`    | `string \| null` | `null` clears the field.                         |

**Response `200`** — the updated Task object.

**Error Responses**

| Status | Condition                                  |
|--------|--------------------------------------------|
| `400`  | Body is invalid JSON.                      |
| `404`  | Task not found or is soft-deleted.         |

---

#### `DELETE /api/tasks/:id`

Soft-deletes a task by setting its `status` to `"deleted"`. The record is retained in storage.

**Response `200`**
```json
{ "success": true }
```

**Error Responses**

| Status | Condition                                  |
|--------|--------------------------------------------|
| `404`  | Task not found or already deleted.         |

---

## Common Error Responses

These apply to all endpoints.

| Status | Condition                                         |
|--------|---------------------------------------------------|
| `404`  | Route does not match any known API path.          |
| `405`  | HTTP method is not supported for the matched route. |
