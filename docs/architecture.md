# QuickNotes System Architecture

## 1. Overview

QuickNotes is a note-taking application that allows users to create, view, update, delete, and organise their notes. This document describes the proposed architecture for a production version of QuickNotes designed to support approximately one million registered users.

The architecture uses a web client, load balancing, multiple application servers, caching, a relational database, and background workers. These components help the system remain responsive, reliable, and scalable as the number of users grows.

## 2. Functional Requirements

The system should support the following functions:

1. User registration and login.
2. Creating notes with a title and body.
3. Viewing all notes belonging to the authenticated user.
4. Viewing an individual note.
5. Updating an existing note.
6. Deleting a note.
7. Creating tags and assigning tags to notes.
8. Searching and filtering notes.
9. Validating user input before saving it.
10. Displaying appropriate loading, success, empty, and error messages.
11. Preventing users from accessing notes belonging to other users.

## 3. Non-Functional Requirements

### Performance

Common operations, such as viewing notes, should respond quickly under normal conditions. Caching and database indexes can help reduce response times.

### Scalability

The system should support increasing numbers of users and requests by adding application servers and improving database capacity when necessary.

### Availability

The application should remain available when an individual application server fails. Health checks, multiple servers, and database recovery mechanisms help reduce downtime.

### Security

The system should use HTTPS, securely hash passwords, authenticate users, authorise access to notes, validate input, and protect against common web vulnerabilities.

### Reliability

Database backups, transaction handling, monitoring, and recovery procedures should help protect user data and support recovery after failures.

### Maintainability

The application should separate the frontend, backend, database, and background processing responsibilities. This makes individual components easier to test, update, and troubleshoot.

## 4. Load Estimates for One Million Users

The following figures are planning estimates rather than measured traffic.

### Assumptions

* Registered users: 1,000,000.
* Daily active users: 10% of registered users, or 100,000.
* Each daily active user makes 20 note-read requests per day.
* Each daily active user makes 2 write requests per day.
* For the storage estimate, assume those 2 daily writes are newly created notes.
* Average stored size per note, including its text and basic metadata: approximately 5 KB.
* One day contains 86,400 seconds.

### Read Requests

Daily read requests:

100,000 users × 20 reads = 2,000,000 reads per day.

Average reads per second:

2,000,000 ÷ 86,400 ≈ 23 reads per second.

### Write Requests

Daily write requests:

100,000 users × 2 writes = 200,000 writes per day.

Average writes per second:

200,000 ÷ 86,400 ≈ 2.3 writes per second.

### Peak Traffic

Traffic is not evenly distributed throughout the day. For initial planning, assume peak traffic is ten times the average.

* Peak reads: approximately 230 requests per second.
* Peak writes: approximately 23 requests per second.

These figures would need to be verified through monitoring and load testing in a real deployment.

### Annual Storage Estimate

If the 200,000 daily writes represent newly created notes:

200,000 × 365 = 73,000,000 new notes per year.

At approximately 5 KB per note:

73,000,000 × 5 KB = 365,000,000 KB, or approximately 365 GB of raw note data per year using decimal storage units.

This estimate excludes additional storage for indexes, backups, replicas, logs, and other database overhead. Actual storage requirements will depend on note sizes, retention policies, and the database implementation.

## 5. Proposed Architecture

### Architecture Diagram

```text
                         USERS
                           |
                           v
                    WEB BROWSER
                  HTML, CSS, JavaScript
                           |
                           v
                         DNS
                           |
                           v
                  CDN / STATIC CONTENT
                           |
                           v
                    LOAD BALANCER
                      /         \
                     v           v
              APPLICATION A   APPLICATION B
                     \           /
                      \         /
                       v       v
                      SHARED CACHE
                         (Redis)
                           |
                 +---------+---------+
                 |                   |
                 v                   v
          PRIMARY DATABASE      READ REPLICA
            (PostgreSQL)       (PostgreSQL)
                 |
                 v
             MESSAGE QUEUE
                 |
                 v
          BACKGROUND WORKER
```

This diagram shows the main components and their relationships. In production, the database, cache, queue, and other critical services should also be configured for appropriate redundancy and recovery.

### Component Responsibilities

**1. Web Browser**

The browser displays the QuickNotes interface and sends API requests when users perform actions such as creating or viewing notes.

**2. DNS**

DNS translates the application's domain name into the address of the appropriate service.

**3. CDN**

A Content Delivery Network serves static resources such as HTML, CSS, JavaScript, and images from locations closer to users. API requests may go directly to the API domain rather than through the static-content cache.

**4. Load Balancer**

The load balancer distributes incoming API requests across healthy application servers.

**5. Application Servers**

Multiple application servers execute backend logic, authenticate users, validate input, enforce permissions, and communicate with the database and other services.

**6. Shared Cache**

A cache such as Redis stores selected frequently requested data to reduce repeated database queries. Cached data must be invalidated or updated when the underlying information changes.

**7. Primary Database**

The primary PostgreSQL database handles authoritative data writes and stores users, notes, tags, and their relationships.

**8. Read Replica**

A read replica receives replicated database changes and can serve suitable read queries, reducing some of the read workload on the primary database. Replication may introduce a short delay before new changes become visible.

**9. Message Queue**

The queue holds background jobs so that the application does not need to complete every secondary task during the user's request.

**10. Background Worker**

Workers process queued jobs, such as sending notifications, generating reports, or performing scheduled cleanup.

**11. Monitoring and Backups**

Monitoring tracks application health, request latency, error rates, and database performance. Automated backups and tested recovery procedures help protect against data loss.

## 6. Request Flow: GET /notes

When a user opens their notes list, the following steps occur:

1. The browser sends an HTTPS request to `GET /notes`.
2. DNS resolves the API domain.
3. The load balancer forwards the request to a healthy application server.
4. The application server authenticates the user and checks their permissions.
5. The application checks whether suitable notes are available in the cache.
6. If the cache does not contain the required data, the application queries the database. An appropriate read replica may serve the query.
7. The application returns the user's notes as JSON with an HTTP `200 OK` response.
8. The browser displays the notes.

The backend must ensure that users can retrieve only their own notes. Pagination should be used so that a request does not return an unnecessarily large number of records.

## 7. Request Flow: POST /notes

When a user creates a note, the following steps occur:

1. The browser sends an HTTPS `POST /notes` request containing the note title and body.
2. The load balancer forwards the request to a healthy application server.
3. The application authenticates the user and validates the request body.
4. The application associates the new note with the authenticated user's account.
5. The application saves the note to the primary database within an appropriate transaction.
6. If additional background work is required, a job can be placed on the message queue.
7. The application returns the created note with an HTTP `201 Created` response.
8. The browser displays the new note and a success message.
9. A background worker processes any queued secondary tasks.

The database write should succeed before the application reports that the note has been created. If a required database operation fails, the application should return an appropriate error instead of reporting false success.

## 8. Scalability Strategies

### Horizontal Application Scaling

More application servers can be added behind the load balancer as traffic increases. Keeping application servers stateless where practical makes it easier to distribute requests between them.

### Database Optimisation

Indexes, efficient SQL queries, pagination, connection pooling, and appropriate database resources can improve database performance.

### Caching

Frequently accessed data can be cached to reduce repeated database queries. The application must have a clear strategy for invalidating or refreshing cached data.

### Read Replicas

Read replicas can distribute eligible read traffic away from the primary database. The application must account for possible replication lag when immediate consistency is required.

### Background Processing

Tasks that do not need to finish before responding to a user can be placed on a queue and processed asynchronously by workers.

### Capacity Monitoring

Traffic, CPU usage, memory consumption, database connections, storage growth, and response times should be monitored to guide scaling decisions.

## 9. Architecture Trade-Offs

### Trade-Off 1: Caching Versus Data Freshness

Caching reduces database load and can improve response times. However, cached notes may become outdated when a user creates, edits, or deletes a note. The system needs a cache invalidation or refresh strategy.

### Trade-Off 2: Read Replicas Versus Immediate Consistency

Read replicas can improve read capacity, but updates may take time to replicate. Requests that must immediately reflect a recent change should use an appropriate consistency strategy, such as reading from the primary database.

### Trade-Off 3: Multiple Application Servers Versus Cost

Running multiple servers improves capacity and allows requests to continue when one server fails. However, it increases hosting costs and operational complexity.

### Trade-Off 4: Background Queues Versus Simplicity

Queues allow slower tasks to run independently of the user's request and can help absorb traffic spikes. However, they introduce additional components, monitoring requirements, and the possibility of delayed processing.

## 10. Avoiding Single Points of Failure

A single point of failure is a component whose failure can make the entire system unavailable or prevent a critical operation.

QuickNotes can reduce this risk through the following measures:

1. Run at least two application servers behind a load balancer.
2. Configure health checks so the load balancer avoids unhealthy application servers.
3. Deploy critical services across separate availability zones where supported.
4. Maintain automated database backups and regularly test restoration.
5. Configure database failover and replication according to recovery requirements.
6. Use redundant or managed cache and message-queue services where appropriate.
7. Monitor critical services and alert the team when failures occur.
8. Maintain documented recovery procedures and test them periodically.

A read replica alone does not guarantee automatic database failover. Failover must be configured and tested separately.

## 11. Conclusion

The proposed QuickNotes architecture separates the user interface, application logic, data storage, caching, and background processing. Multiple application servers, database optimisation, caching, and asynchronous jobs provide options for handling increasing traffic.

The design also recognises that scalability introduces trade-offs involving cost, consistency, operational complexity, and reliability. Actual infrastructure requirements should be confirmed through monitoring, load testing, and review of real usage patterns.
