# Backend Technical Documentation

## Overview

The Tektik backend is a high-performance, serverless application built on **Cloudflare Workers** using the **Hono** framework. It leverages **D1** (Cloudflare's serverless SQLite database) for persistence and **Durable Objects** for real-time collaboration features (WebSockets). The codebase follows a Clean Architecture pattern with Dependency Injection to ensure maintainability and testability.

## Technology Stack

-   **Runtime**: Cloudflare Workers
-   **Framework**: [Hono](https://hono.dev/)
-   **Database**: Cloudflare D1 (SQLite)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **Package Manager**: Bun
-   **Testing**: Vitest (Unit), Docker + Vitest (Integration)
-   **Validation**: Zod & @hono/zod-openapi
-   **Real-time**: Cloudflare Durable Objects (WebSockets)

## Architecture

The application follows a strict **Clean Architecture**:

1.  **Handlers (Controllers)**: Defined in `src/routes`. These handle HTTP requests, validate input using Zod schemas, and invoke Services.
2.  **Services**: Defined in `src/services`. Contain all business logic. They do not access the database directly but use Repositories.
3.  **Repositories**: Defined in `src/repositories`. Handle all direct data access (Drizzle ORM calls).
4.  **Dependency Injection**: Services and Repositories are injected, allowing for easy mocking during testing.

### Directory Structure

```
backend/
├── src/
│   ├── db/              # Database schema and connection
│   ├── durable-objects/ # WebSocket handling (ProjectBoard)
│   ├── middleware/      # Auth and generic middleware
│   ├── repositories/    # Data access layer
│   ├── routes/          # API definitions (Hono)
│   ├── schemas/         # Zod schemas for validation
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── index.ts         # Application entry point
├── tests/               # Unit and Integration tests
├── drizzle/             # Database migrations
└── worker-configuration.d.ts # Type definitions for Env vars
```

## Key Features

### Authentication
Authentication is abstractable, currently supporting Google Login and JWT-based session management.

### Real-time Collaboration (WebSockets)
Real-time updates on the Kanban board are powered by **Cloudflare Durable Objects**.
-   **Class**: `ProjectBoard` (in `src/durable-objects`)
-   **Key feature**: When a task is moved or updated, updates are broadcast via WebSocket to all clients viewing that project.
-   **Toggle**: Use the experimental toggle to enable/disable.

### Database
-   **D1**: SQLite database.
-   **Schema**: managed in `src/db/schema.ts`.
-   **Migrations**: Generated using Drizzle Kit.

## Setup & Installation

1.  **Install Dependencies**:
    ```bash
    bun install
    ```

2.  **Environment Variables**:
    Copy `wrangler.jsonc` configuration. Ensure `JWT_SECRET` is set securely.

3.  **Local Development**:
    Start the local development server (simulating Cloudflare Workers):
    ```bash
    bun run dev
    ```

4.  **Database Setup (Local)**:
    Apply migrations to the local D1 instance:
    ```bash
    bun run db:migrate:local
    ```

## Testing

-   **Unit Tests**:
    ```bash
    bun run test
    ```
-   **Integration Tests**:
    Runs a full environment using Docker:
    ```bash
    bun run test:integration
    ```

## Deployment

Deploy to Cloudflare Workers:

```bash
bun run deploy
```

This will also minify the build.

## API Endpoints

The API is structured around resources:
-   `/auth/*`: Authentication (register, login, google).
-   `/projects/*`: Project management.
-   `/tasks/*`: Task CRUD.
-   `/statuses/*`: Kanban columns.
-   `/comments/*`: Task comments.
-   `/notifications/*`: User notifications.
-   `/webhooks/*`: Webhook management.

Swagger documentation is available at `/doc`.
