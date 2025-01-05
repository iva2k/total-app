import * as env from '$env/static/private';
import type { DalConfig, IDatabase, IValidationService, Schema } from '$lib/dal/dal-types';
import { KyselySqliteDatabase } from './dal-kysely-sqlite';
import { KnexSqliteDatabase } from './dal-knex-sqlite';
// import { PostgresDatabase } from './dal-postgres';

import { dbConfig as defaultConfig, dbSchema as defaultSchema } from '$lib/db-schema';
import { ValidationService } from '$lib/dal/dal-validation';

// Factory function to create a IDatabase instance
export function createDatabase<TDatabase>(
  config?: DalConfig,
  schema?: Schema
): IDatabase<TDatabase> {
  schema = schema ?? defaultSchema;
  config = config ?? defaultConfig;
  const implementation = config.implementation ?? env.DB_IMPLEMENTATION ?? 'knex-sqlite';

  switch (implementation) {
    case 'postgres': {
      //   const connectionString = config?.connectionString ?? env.DB_CONNECTION_STRING;
      //   return new PostgresDatabase(connectionString, schema);
      throw new Error('Postgres backend not yet implemented');
    }
    case 'kysely-sqlite': {
      // New Kysely option
      const dbFilePath = config?.dbFilePath ?? env.DB_SQLITE_FILE ?? 'database.sqlite';
      return new KyselySqliteDatabase<TDatabase>(dbFilePath, schema);
    }
    case 'knex-sqlite':
    default: {
      const dbFilePath = config?.dbFilePath ?? env.DB_SQLITE_FILE ?? 'database.sqlite';
      return new KnexSqliteDatabase(dbFilePath, schema);
    }
  }
}

let db: IDatabase<any> | null = null;

// Singleton function to get the IDatabase instance with fixed schema and config
export async function getDatabase<TDatabase>(
  config?: DalConfig,
  schema?: Schema
): Promise<IDatabase<TDatabase>> {
  /* TODO: (when needed) create thread-safe implementation (nodejs is single-threaded)
  Note: Be cautious with concurrency and thread safety when using shared resources: db = await getDatabase();.
  For production applications, consider updating your DAL to Support Connection Pooling / manage connections more efficiently.
  */

  if (!db) {
    db = createDatabase<TDatabase>(config, schema);
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

export function __setDatabase<TDatabase>(value: IDatabase<TDatabase> | null) {
  // Special function to set/reset the global for testing purposes.
  db = value;
}

// Factory function to create a IValidationService instance
export function createValidator(schema: Schema, config?: DalConfig): IValidationService {
  const implementation = config?.implementation ?? env.DB_IMPLEMENTATION ?? 'knex-sqlite';

  switch (implementation) {
    case 'postgres': {
      //   const connectionString = config?.connectionString ?? env.DB_CONNECTION_STRING;
      //   return new PostgresDatabase(connectionString, schema);
      throw new Error('Postgres validation not yet implemented');
    }
    case 'kysely-sqlite': {
      //   const connectionString = config?.connectionString ?? env.DB_CONNECTION_STRING;
      //   return new PostgresDatabase(connectionString, schema);
      throw new Error('Kysely-Sqlite validation not yet implemented');
    }
    case 'knex-sqlite':
    default: {
      return new ValidationService(schema);
    }
  }
}

let validator: IValidationService | null = null;

// Singleton function to get the IValidationService instance with fixed schema and config
export async function getValidator(
  schema?: Schema,
  config?: DalConfig
): Promise<IValidationService> {
  if (!validator) {
    validator = createValidator(schema ?? defaultSchema, config ?? defaultConfig);
  }
  return validator;
}

export async function closeValidator(): Promise<void> {
  if (validator) {
    // await validator.close();
    validator = null;
  }
}

export function __setValidator(value: IValidationService | null) {
  // Special function to set/reset the global for testing purposes.
  validator = value;
}
