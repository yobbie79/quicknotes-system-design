# QuickNotes System Design

QuickNotes is a note-taking application prototype built to practise frontend development, REST API integration, database design, and system architecture. Users can load notes from an API, create notes, and delete notes through a simple browser interface.

## Features

* Load notes from a REST API using `GET`.
* Create notes using `POST`.
* Delete notes using `DELETE`.
* Display loading, success, error, and empty states.
* Validate note titles and note content.
* Disable relevant buttons while requests are being processed.
* Display note content safely using JavaScript `textContent`.
* Document a proposed backend API, relational database, and scalable system architecture.

## Technologies Used

* HTML5
* CSS3
* JavaScript
* Fetch API
* JSONPlaceholder practice API
* SQL and PostgreSQL database design
* Git and GitHub

## Getting Started

### Requirements

You need:

* A web browser.
* Visual Studio Code or another code editor.
* The Live Server extension in VS Code.
* An internet connection to access the practice API.

### Running the Application

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html`.
4. Right-click the file and select **Open with Live Server**.
5. Click **Load notes** to retrieve sample notes.
6. Use the form to create a note.
7. Use the **Delete** button on a note to remove it from the displayed list.

### Important API Limitation

The frontend uses [JSONPlaceholder](https://jsonplaceholder.typicode.com/) as a practice API. It simulates creating and deleting resources, but changes are not permanently saved on the server. Notes created during a session may disappear when the notes are loaded again or the page is refreshed.

A production version would connect to a real backend with authentication, persistent database storage, and access controls.

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── style.css
├── api.js
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## System Design Documentation

The `docs` directory contains the design documents for a proposed production version of QuickNotes.

* **[API Design](docs/api-design.md)** — REST endpoints, HTTP methods, request and response examples, status codes, and error handling.
* **[Data Model](docs/data-model.md)** — Database tables, relationships, SQL schema, queries, indexes, and the SQL versus NoSQL decision.
* **[Architecture](docs/architecture.md)** — Functional and non-functional requirements, traffic and storage estimates, architecture diagram, request flows, scalability strategies, and reliability considerations.

## What I Learned

Through this project, I learned how to:

1. Use JavaScript's Fetch API and asynchronous functions to communicate with a REST API.
2. Handle HTTP errors and display loading, success, and failure messages.
3. Send `GET`, `POST`, and `DELETE` requests and understand the limitations of a practice API.
4. Design REST endpoints and describe their request and response formats.
5. Model relational data using primary keys, foreign keys, relationships, and SQL queries.
6. Explain how caching, load balancing, database replicas, and background workers can support a growing application.
7. Use Git and GitHub to track changes and maintain a project repository.

## Future Improvements

Possible improvements include:

* Connecting the frontend to a persistent backend and PostgreSQL database.
* Adding user registration, login, and authentication.
* Supporting note editing, searching, filtering, and tags.
* Adding automated tests and stronger input validation.
* Deploying the application and monitoring its performance.

## Author

Developed as a practical project to strengthen frontend development and system design skills.
