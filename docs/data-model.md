# QuickNotes Database Design

## 1. Overview

QuickNotes needs a database to store user accounts, notes, and tags. I would use a relational database such as PostgreSQL because the application has related data that must remain consistent.

The database contains four main tables:

* `users`: Stores user account information.
* `notes`: Stores notes created by users.
* `tags`: Stores tags used to organise notes.
* `note_tags`: Connects notes to tags.

## 2. Database Tables

### Users Table

| Column        | Type         | Constraints                 | Description              |
| ------------- | ------------ | --------------------------- | ------------------------ |
| id            | INTEGER      | Primary key, auto-generated | Unique user identifier   |
| name          | VARCHAR(100) | NOT NULL                    | User's name              |
| email         | VARCHAR(255) | NOT NULL, UNIQUE            | User's email address     |
| password_hash | VARCHAR(255) | NOT NULL                    | Securely hashed password |
| created_at    | TIMESTAMP    | NOT NULL                    | Account creation time    |

The email address is unique so that two accounts cannot register with the same email.

### Notes Table

| Column     | Type         | Constraints                 | Description            |
| ---------- | ------------ | --------------------------- | ---------------------- |
| id         | INTEGER      | Primary key, auto-generated | Unique note identifier |
| user_id    | INTEGER      | Foreign key, NOT NULL       | Owner of the note      |
| title      | VARCHAR(100) | NOT NULL                    | Note title             |
| body       | TEXT         | NOT NULL                    | Note contents          |
| created_at | TIMESTAMP    | NOT NULL                    | Creation time          |
| updated_at | TIMESTAMP    | NOT NULL                    | Last update time       |

Each note belongs to one user. The `user_id` foreign key links the note to its owner.

### Tags Table

| Column     | Type        | Constraints                 | Description           |
| ---------- | ----------- | --------------------------- | --------------------- |
| id         | INTEGER     | Primary key, auto-generated | Unique tag identifier |
| user_id    | INTEGER     | Foreign key, NOT NULL       | User who owns the tag |
| name       | VARCHAR(50) | NOT NULL                    | Tag name              |
| created_at | TIMESTAMP   | NOT NULL                    | Creation time         |

A user can create tags such as `Work`, `Study`, and `Personal`.

### Note_Tags Table

| Column  | Type    | Constraints                        | Description |
| ------- | ------- | ---------------------------------- | ----------- |
| note_id | INTEGER | Primary key component, foreign key | Linked note |
| tag_id  | INTEGER | Primary key component, foreign key | Linked tag  |

This junction table connects notes and tags. The combination of `note_id` and `tag_id` forms a composite primary key, preventing the same tag from being linked to the same note more than once.

## 3. Relationships

The database relationships are:

* One user can have many notes.
* One user can have many tags.
* One note can have many tags.
* One tag can be associated with many notes.
* `note_tags` resolves the many-to-many relationship between notes and tags.

### Relationship Diagram

```text
USERS
-----
id (PK)
  |
  | 1-to-many
  v
NOTES
-----
id (PK)
user_id (FK)
  |
  | one-to-many
  v
NOTE_TAGS
---------
note_id (PK, FK)
tag_id  (PK, FK)
  ^
  | many-to-one
  |
TAGS
----
id (PK)
user_id (FK)
```

A note may exist without any tags. The junction table contains records only for tags that are associated with notes.

## 4. SQL Table Creation

The following SQL uses PostgreSQL syntax.

### Create the Users Table

```sql
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Create the Notes Table

```sql
CREATE TABLE notes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

The application must update `updated_at` whenever a note is edited.

### Create the Tags Table

```sql
CREATE TABLE tags (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name),
    UNIQUE (user_id, id)
);
```

The constraints prevent a user from creating duplicate tag names and allow the database to enforce tag ownership in the junction table.

### Create the Note_Tags Table

```sql
CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    PRIMARY KEY (note_id, tag_id),

    FOREIGN KEY (user_id, note_id)
        REFERENCES notes(user_id, id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id, tag_id)
        REFERENCES tags(user_id, id)
        ON DELETE CASCADE
);
```

The composite foreign keys ensure that a tag and a note linked through `note_tags` belong to the same user.

## 5. SQL Queries

### Query 1: Retrieve a User's Most Recent Notes

This query returns the ten newest notes belonging to a particular user.

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 10;
```

The `WHERE` clause restricts the results to the selected user. The `ORDER BY` clause places the newest notes first.

### Query 2: Count Notes for Each User

```sql
SELECT
    users.id,
    users.name,
    COUNT(notes.id) AS total_notes
FROM users
LEFT JOIN notes
    ON users.id = notes.user_id
GROUP BY users.id, users.name
ORDER BY total_notes DESC;
```

This query uses a `LEFT JOIN` so that users who have not created any notes are still included in the results.

### Query 3: Find Notes with a Particular Tag

```sql
SELECT
    notes.id,
    notes.title,
    notes.body,
    tags.name AS tag_name
FROM notes
JOIN note_tags
    ON notes.id = note_tags.note_id
JOIN tags
    ON note_tags.tag_id = tags.id
WHERE notes.user_id = 1
  AND tags.name = 'Study'
ORDER BY notes.created_at DESC;
```

This query joins three tables to find notes associated with the `Study` tag for a specific user.

### Query 4: Count Notes by Tag

```sql
SELECT
    tags.name,
    COUNT(note_tags.note_id) AS total_notes
FROM tags
LEFT JOIN note_tags
    ON tags.id = note_tags.tag_id
WHERE tags.user_id = 1
GROUP BY tags.id, tags.name
ORDER BY total_notes DESC;
```

This query counts how many of a user's notes are associated with each tag, including tags that have not been used.

## 6. Indexing

An index can improve the performance of queries that retrieve notes by user and sort them by creation time.

```sql
CREATE INDEX idx_notes_user_created
ON notes (user_id, created_at DESC);
```

This index supports queries that filter notes by `user_id` and order them by `created_at` in descending order.

Indexes use additional storage and make inserts or updates slightly more expensive, so they should be created for queries that need them.

The unique constraint on `users.email` also creates an index that helps the database find accounts by email address.

## 7. SQL vs NoSQL

For QuickNotes, I would choose PostgreSQL, a relational SQL database.

The main reason is that the application has clear relationships between users, notes, and tags. Foreign keys help maintain data integrity, while joins make it possible to retrieve notes together with their tags.

PostgreSQL also supports transactions. For example, creating a note and associating its tags can be performed in one transaction so that the changes either succeed together or are rolled back together.

A NoSQL database could be useful for a system with highly flexible document structures or particular large-scale access patterns. However, it is not necessary for the current QuickNotes design.

## 8. Data Integrity and Security

The database design uses primary keys to identify records and foreign keys to maintain relationships.

The `NOT NULL` and `UNIQUE` constraints prevent missing required values and duplicate account emails. The cascading delete rules remove dependent notes and tag associations when their parent records are deleted.

In a production application, passwords must be stored as secure password hashes, not plain text. The backend must also check ownership before allowing a user to access or modify notes.

Database credentials should be stored securely in environment variables, and database connections should use appropriate access permissions.
