# QuickNotes REST API Design

## 1. Overview

The QuickNotes REST API allows users to create, view, update, and delete their notes. It also supports user accounts and tags for organising notes.

The API uses HTTP methods to perform operations and exchanges data in JSON format. In a production application, users must authenticate before accessing their private notes.

**Base URL:** `https://api.quicknotes.example/v1`

The base URL is an example and is not a live server.

## 2. API Endpoints

| Method | Endpoint           | Description                             | Success Status |
| ------ | ------------------ | --------------------------------------- | -------------- |
| POST   | `/auth/register`   | Register a new user account             | 201 Created    |
| POST   | `/auth/login`      | Authenticate a user                     | 200 OK         |
| GET    | `/notes`           | Retrieve the authenticated user's notes | 200 OK         |
| GET    | `/notes/{id}`      | Retrieve one note by its ID             | 200 OK         |
| POST   | `/notes`           | Create a new note                       | 201 Created    |
| PUT    | `/notes/{id}`      | Replace an existing note                | 200 OK         |
| PATCH  | `/notes/{id}`      | Update selected note fields             | 200 OK         |
| DELETE | `/notes/{id}`      | Delete a note                           | 204 No Content |
| GET    | `/tags`            | Retrieve the user's tags                | 200 OK         |
| POST   | `/notes/{id}/tags` | Associate a tag with a note             | 201 Created    |

The `{id}` placeholder represents a specific resource identifier.

## 3. Example: Create a Note

### Request

**Method:** `POST`

**Path:** `/v1/notes`

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request body:**

```json
{
  "title": "Study plan",
  "body": "Revise cloud computing concepts this evening.",
  "tagIds": [2, 4]
}
```

The title is required and must not exceed 100 characters. The body contains the note's details. The optional `tagIds` array associates existing tags with the note.

### Successful response

**Status:** `201 Created`

```json
{
  "id": 105,
  "userId": 12,
  "title": "Study plan",
  "body": "Revise cloud computing concepts this evening.",
  "tags": [
    {
      "id": 2,
      "name": "Study"
    },
    {
      "id": 4,
      "name": "Important"
    }
  ],
  "createdAt": "2026-10-29T09:00:00Z",
  "updatedAt": "2026-10-29T09:00:00Z"
}
```

The server generates the note ID and timestamps. The `userId` comes from the authenticated user rather than being trusted from the request body.

## 4. Example: List Notes

### Request

**Method:** `GET`

**Path:** `/v1/notes?limit=10&offset=0`

**Headers:**

```http
Authorization: Bearer <access_token>
```

The `limit` parameter controls the number of returned notes, while `offset` determines where the results begin.

### Successful response

**Status:** `200 OK`

```json
{
  "data": [
    {
      "id": 105,
      "title": "Study plan",
      "body": "Revise cloud computing concepts this evening.",
      "createdAt": "2026-10-29T09:00:00Z"
    },
    {
      "id": 104,
      "title": "Shopping list",
      "body": "Buy milk and bread.",
      "createdAt": "2026-10-28T15:30:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 2
  }
}
```

The response contains the notes and pagination information. In this example, only two notes exist for the authenticated user.

## 5. Error Handling

The API returns an appropriate HTTP status code and a JSON response when a request fails.

| Status | Error                 | Meaning                                                  |
| ------ | --------------------- | -------------------------------------------------------- |
| 400    | Bad Request           | The request contains invalid data                        |
| 401    | Unauthorized          | Authentication is missing or invalid                     |
| 403    | Forbidden             | The user is not permitted to perform the operation       |
| 404    | Not Found             | The requested resource does not exist or is inaccessible |
| 500    | Internal Server Error | An unexpected server error occurred                      |

### Example error response

**Status:** `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "title",
        "message": "The title is required and must not exceed 100 characters."
      }
    ]
  }
}
```

Error responses should provide useful information without exposing passwords, access tokens, database credentials, or internal server details.

## 6. Authentication and Authorisation

The production API uses authentication to verify a user's identity. Protected endpoints require a valid access token.

Authorisation ensures that users can only access or modify notes they own. A user must not be able to read, update, or delete another user's notes simply by changing a note ID in the URL.

Passwords should be securely hashed before storage. HTTPS must be used to protect data transmitted between the client and server.

## 7. Validation and Security

The API validates all incoming data on the server, even when the frontend also performs validation.

Validation rules include:

* Note titles are required and limited to 100 characters.
* Note bodies must contain valid text within the configured size limit.
* Tag IDs must refer to existing tags accessible to the user.
* Pagination parameters must be within reasonable limits.
* Users may only access resources they are authorised to use.

The server should use parameterised database queries or a suitable ORM to reduce SQL injection risks.

## 8. HTTP Status Code Choices

* `200 OK`: A request succeeded and returned a response.
* `201 Created`: A new resource was created successfully.
* `204 No Content`: An operation succeeded and no response body is required.
* `400 Bad Request`: The submitted data is invalid.
* `401 Unauthorized`: The request requires valid authentication.
* `403 Forbidden`: The authenticated user lacks permission.
* `404 Not Found`: The requested resource cannot be found or accessed.
* `500 Internal Server Error`: An unexpected server failure occurred.

## 9. Relationship to the Practice Frontend

The current frontend uses JSONPlaceholder at `https://jsonplaceholder.typicode.com/posts` to practise GET, POST, and DELETE requests.

JSONPlaceholder is a demonstration service, not the actual QuickNotes backend. Its simulated writes are not permanently stored.

The endpoints documented in this file describe a proposed production API that would need to be implemented and deployed before the frontend could use it.
