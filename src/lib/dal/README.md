# Database Abstraction Layer (DAL)

The Database Abstraction Layer (DAL) is a bonus component of the TotalApp project, providing a unified interface for database operations across different storage mechanisms. This abstraction allows for easier switching between database technologies and provides a consistent API for the rest of the application to interact with data storage.

## Structure

The DAL is composed of several key files:

- `src/lib/db-schema.ts`: Defines the database schema and types.
- `dal.ts`: Contains the main DAL methods.
- `dal-types.ts`: Contains the main DAL types definitions.
- `dal-knex-sqlite.ts`: Implements the DAL interface for Sqlite using Knex.
- `dal-kysely-sqlite.ts`: Implements the DAL interface for Sqlite using Kysely.
- `dal-migration.ts`: Implements automated database migration.
- `dal-validation.ts`: Implements data validation.
- `src/lib/services/db-init.ts`: Implements initializeDatabase() for database backend initialization (intended for use in `src/hooks.server.ts`).

## Key Components

### DAL Methods

The `dal.ts` module provides methods to setup database connection singleton and data validation singleton for the app.

- `getDatabase()`: Create a singleton and return `IDatabase` object for the whole app.
- `getValidator()`: Create a singleton and return `IValidationService` object for the whole app.

### IDatabase

The `IDatabase` interface defines the standard methods that all DAL implementations must provide:

- `initialize()`: Initialize the database connection.
- `close()`: Close the database connection.
- `transaction()`: Create new transaction (returns transaction object with the same API as below)
- `findById()`: Retrieve a record by its ID.
- `findAll()`: Retrieve all records of a specific type.
- `create()`: Create a new record.
- `update()`: Update a record.
- `delete()`: Delete a record by its ID.

## Usage

DAL is fully integrated in TotalApp - see `src/hooks.server.ts` and `src/lib/db-init.ts`.

For using DAL in dev and production, edit `.env` and `.env.production` files and specify backend to use and relevant authentication tokens.

Note: Currently only Sqlite backend is implemented. Other backends are in development.
