import type { ColumnDefinition } from '$lib/dal/dal-migration';
import { z } from 'zod';

// Define the basic field types for your entities
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'json' | 'any';

// Base Entity interface that all entities should extend
// export interface Entity {
//   id: string;
// }
// export interface EntityWithTimestamps extends Entity {
//   created_at?: string | Date;
//   updated_at?: string | Date;
// }

// This is the validation structure for data before inserting into the DB
export const EntitySchema = z.object({
  id: z.string().uuid().optional() // UUID format for IDs
  // Additional fields can be validated dynamically
});
export const EntityWithTimestampsSchema = z.object({
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});
export type Entity = z.infer<typeof EntitySchema>;
export type EntityWithTimestamps = z.infer<typeof EntityWithTimestampsSchema>;

// Entity definition for the schema
export interface EntityDefinition {
  name: string;
  fields: { [fieldName: string]: FieldType };
  primaryKey?: string;
}

// Schema for all entities in the system
// export interface Schema {
//   [entityName: string]: EntityDefinition;
// }
export type Schema = {
  [key: string]: z.ZodType<any, any, any>;
};

export interface ITransaction<_TDatabase> {
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  findById<T extends Entity>(entityName: string, id: string): Promise<T | null>;
  findAll<T extends Entity>(entityName: string): Promise<T[]>;
  create<T extends Entity>(entityName: string, entity: T): Promise<T>;
  update<T extends Entity>(entityName: string, entity: T): Promise<T>;
  delete(entityName: string, id: string): Promise<void>;
}

// Database interface for managing transactions and repositories
export interface IDatabase<TDatabase> {
  close(): Promise<void>;
  initialize(seed?: (db: IDatabase<TDatabase>, dbFilePath: string) => Promise<void>): Promise<void>;
  transaction(): Promise<ITransaction<TDatabase>>;
  findById<T extends Entity>(entityName: string, id: string): Promise<T | null>;
  findAll<T extends Entity>(entityName: string): Promise<T[]>;
  create<T extends Entity>(entityName: string, entity: T): Promise<T>;
  update<T extends Entity>(entityName: string, entity: T): Promise<T>;
  delete(entityName: string, id: string): Promise<void>;
}

export interface IValidationService {
  validate<T extends Entity>(entityName: string, data: T): z.SafeParseReturnType<T, T>;
  parse<T extends Entity>(entityName: string, data: unknown): T;
}

// Configuration interface for the DAL
export interface DalConfig {
  implementation?: 'default' | 'knex-sqlite' | 'kysely-sqlite'; // or 'postgres', 'mysql', etc., as you expand support
  dbFilePath?: string; // Path to SQLite file
  connectionString?: string; // Connection string for other databases like PostgreSQL
}

// Zod schema validation for generic entities

// Generic Zod validator for field types based on the `FieldType`
export function createFieldValidator(fieldType: FieldType): z.ZodTypeAny {
  switch (fieldType) {
    case 'string':
      return z.string();
    case 'number':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'date':
      return z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format'
      });
    case 'json':
      return z.any(); // Assuming JSON fields can be anything
    case 'any':
      return z.any();
    default:
      return z.any();
  }
}

// Function to create Zod schema from an EntityDefinition
export function createEntitySchema(entityDef: EntityDefinition): z.ZodObject<any> {
  const schema: any = {};
  for (const [fieldName, fieldType] of Object.entries(entityDef.fields)) {
    schema[fieldName] = createFieldValidator(fieldType);
  }

  return z.object(schema);
} // Define Migration Steps

type MigrationStep =
  | { type: 'createTable'; tableName: string; columns: ColumnDefinition[] }
  | { type: 'dropTable'; tableName: string }
  | { type: 'addColumn'; tableName: string; column: ColumnDefinition }
  | { type: 'dropColumn'; tableName: string; columnName: string }
  | { type: 'modifyColumn'; tableName: string; column: ColumnDefinition };
// Define Migration Plan as an array of MigrationSteps
export type MigrationPlan = MigrationStep[];

export type DbSchemaHistoryItem = {
  schema: Schema;
  planHook: (plan: MigrationPlan) => MigrationPlan;
};

export type DbSchemaHistory = {
  [key: string]: DbSchemaHistoryItem;
};
