# Gemini Code Assistant Context

This document provides context for the Gemini code assistant to effectively assist with development tasks in this NestJS project.

## Project Overview

This is the backend service for a Health Information System - Electronic Medical Record (HIS-EMR) application. It is built using the [NestJS](https://nestjs.com/) framework and written in TypeScript. The service manages core functionalities like user management and is intended to be expanded with features like authentication and more.

### Key Technologies

- **Framework**: NestJS
- **Language**: TypeScript
- **Package Manager**: Yarn
- **API Documentation**: Swagger (OpenAPI)
- **Testing**: Jest for unit and end-to-end (E2E) testing
- **Linting/Formatting**: ESLint and Prettier

## Project Structure

The codebase is organized into a modular structure with a clear separation of concerns:

-   `src/`: Contains all the application source code.
    -   `main.ts`: The application entry point. It initializes the NestJS app, sets up global middleware, pipes, filters, and starts the server.
    -   `app.module.ts`: The root module of the application.
    -   `api/`: Contains code related to the API layer (the "what").
        -   `controllers/`: Handles incoming HTTP requests and delegates to services.
        -   `dtos/`: Data Transfer Objects used for request/response validation and typing.
        -   `common/`: Shared API components like filters, interceptors, middleware, and pipes.
    -   `domain/`: Contains the core business logic and entities (the "how").
        -   `entities/`: Represents the core data structures of the application.
        -   `core/`: Core business logic, exceptions, and other domain-specific components.
    -   `infrastructure/`: Contains code that interacts with external systems and services (e.g., database, logging extensions).
    -   `modules/`: Feature-based modules that encapsulate specific application functionalities (e.g., `UsersModule`).
-   `test/`: Contains end-to-end tests.

## Development Workflow

### Setup

1.  Install dependencies using Yarn:
    ```bash
    yarn install
    ```

### Running the Application

-   To run the application in development mode with file watching:
    ```bash
    yarn start:dev
    ```
-   The server will start on port `3000` by default.
-   The API is available under the `/api/v1` prefix.
-   Swagger API documentation is available at `/api-docs`.

### Key Commands

| Command          | Description                                        |
| ---------------- | -------------------------------------------------- |
| `yarn install`   | Installs all project dependencies.                 |
| `yarn build`     | Compiles the TypeScript code into JavaScript.      |
| `yarn start:dev` | Starts the application in development mode.        |
| `yarn lint`      | Lints the codebase using ESLint.                   |
| `yarn format`    | Formats the code using Prettier.                   |
| `yarn test`      | Runs unit tests (`.spec.ts` files).                |
| `yarn test:e2e`  | Runs end-to-end tests (`.e2e-spec.ts` files).      |
| `yarn test:cov`  | Runs tests and generates a coverage report.        |

## Coding Conventions

-   **Modularity**: Encapsulate features within NestJS modules.
-   **Validation**: Use DTOs with `class-validator` decorators for all incoming request bodies to ensure data integrity.
-   **Error Handling**: Utilize the custom exception filters in `src/api/common/filters` to provide consistent error responses.
-   **Configuration**: Environment-specific configurations should be handled through NestJS's configuration module (though not yet fully implemented).
-   **Dependencies**: Inject dependencies using the NestJS dependency injection system.
