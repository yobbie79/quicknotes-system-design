const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");

let notes = [];

// Reusable function for making API requests.
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }

    if (response.status === 204) {
        return {
            data: null,
            status: response.status
        };
    }

    const data = await response.json();

    return {
        data,
        status: response.status
    };
}

// Display status messages.
function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

// Display notes safely on the page.
function renderNotes() {
    notesList.replaceChildren();

    if (notes.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = "No notes to display. Load notes to get started.";
        notesList.appendChild(emptyItem);
        return;
    }

    notes.forEach((note) => {
        const item = document.createElement("li");
        item.className = "note-card";

        const title = document.createElement("h3");
        title.textContent = note.title || "Untitled note";

        const body = document.createElement("p");
        body.textContent = note.body || "No additional details.";

        item.append(title, body);
        notesList.appendChild(item);
    });
}

// GET: Load the first 10 notes.
async function loadNotes() {
    loadButton.disabled = true;
    showStatus("Loading notes...");

    try {
        const result = await request(`${API_URL}?_limit=10`);
        notes = result.data;

        renderNotes();

        if (notes.length === 0) {
            showStatus("No notes were found.", "success");
        } else {
            showStatus(`Loaded ${notes.length} notes from the server.`, "success");
        }
    } catch (error) {
        showStatus(
            "Sorry, we could not load notes. Check your internet connection and try again.",
            "error"
        );

        console.error("Error loading notes:", error);
    } finally {
        loadButton.disabled = false;
    }
}

// POST: Create a note.
async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (title.length === 0) {
        showStatus("Please enter a note title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus("The title must not exceed 100 characters.", "error");
        titleInput.focus();
        return;
    }

    if (body.length === 0) {
        showStatus("Please enter the note details.", "error");
        bodyInput.focus();
        return;
    }

    submitButton.disabled = true;
    showStatus("Creating note...");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                body,
                userId: 1
            })
        });

        const newNote = result.data;

        // JSONPlaceholder simulates creation but does not permanently save posts.
        notes.unshift(newNote);
        renderNotes();

        noteForm.reset();
        showStatus("Note created successfully (practice API).", "success");
    } catch (error) {
        showStatus(
            "Sorry, we couldn't create the note. Please try again.",
            "error"
        );

        console.error("Error creating note:", error);
    } finally {
        submitButton.disabled = false;
    }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

// Display the initial empty state.
renderNotes();