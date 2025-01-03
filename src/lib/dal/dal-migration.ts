// Import necessary modules
import { z, ZodObject, ZodString, type ZodRawShape } from 'zod';

import { dbSchemaHistory, type SchemaVersion } from '$lib/db-schema';
import type { DbSchemaHistory, Schema, MigrationPlan } from '$lib/dal/dal-types';

// Define ColumnDefinition
export interface ColumnDefinition {
  name: string;
  type: string; // Simplified for demonstration; you might want a more detailed type
  isNullable: boolean;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
}

// Define DB Interface based on Knex Migration API
export interface DB {
  schema: {
    createTable: (tableName: string, callback: (table: any) => void) => Promise<void>;
    dropTable: (tableName: string) => Promise<void>;
    table: (tableName: string, callback: (table: any) => void) => Promise<void>;
  };
  migrate: (plan: MigrationPlan) => Promise<void>;
}

function isUUID(schema: ZodString): boolean {
  return schema._def.checks.some((check) => check.kind === 'uuid');
}
// Utility function to extract schema information from Zod schemas
export function extractSchemaInfo(schema: Schema): SchemaInfo {
  const tables: { [tableName: string]: ColumnDefinition[] } = {};

  for (const [tableName, tableSchema] of Object.entries(schema)) {
    if (tableSchema instanceof ZodObject) {
      const shape = tableSchema.shape as ZodRawShape;
      const columns: ColumnDefinition[] = [];

      for (const [columnName, columnSchema] of Object.entries(shape)) {
        let type = 'string'; // default type
        let isNullable = false;
        let colSch = columnSchema;
        if (colSch.isOptional()) {
          // isOptional type wraps actual field type
          isNullable = true;
          colSch = columnSchema._def.innerType;
        }

        if (colSch instanceof ZodString) {
          if (isUUID(colSch)) {
            type = 'uuid';
            // } else { type = 'string';
          }
        } else if (colSch instanceof z.ZodNumber) {
          type = 'number';
        } else if (colSch instanceof z.ZodDate) {
          type = 'date';
        } else if (colSch instanceof z.ZodBoolean) {
          type = 'boolean';
        }
        // Add more type mappings here as needed

        columns.push({
          name: columnName,
          type,
          isNullable
          // Add more properties if needed
        });
      }

      tables[tableName] = columns;
    }
  }

  return { tables };
}

// Define SchemaInfo
export interface SchemaInfo {
  tables: {
    [tableName: string]: ColumnDefinition[];
  };
}

// Function to compare two schemas and generate a migration plan
export function compareSchemas(prev: SchemaInfo, next: SchemaInfo): MigrationPlan {
  const plan: MigrationPlan = [];

  const prevTables = prev.tables;
  const nextTables = next.tables;

  const prevTableNames = Object.keys(prevTables);
  const nextTableNames = Object.keys(nextTables);

  // Tables to create
  const tablesToCreate = nextTableNames.filter((table) => !prevTableNames.includes(table));
  for (const tableName of tablesToCreate) {
    plan.push({
      type: 'createTable',
      tableName,
      columns: nextTables[tableName]
    });
  }

  // Tables to drop
  const tablesToDrop = prevTableNames.filter((table) => !nextTableNames.includes(table));
  for (const tableName of tablesToDrop) {
    plan.push({
      type: 'dropTable',
      tableName
    });
  }

  // Tables to alter
  const tablesToAlter = nextTableNames.filter((table) => prevTableNames.includes(table));
  for (const tableName of tablesToAlter) {
    const prevColumns = prevTables[tableName];
    const nextColumns = nextTables[tableName];

    const prevColumnNames = prevColumns.map((col) => col.name);
    const nextColumnNames = nextColumns.map((col) => col.name);

    // Columns to add
    const columnsToAdd = nextColumns.filter((col) => !prevColumnNames.includes(col.name));
    for (const column of columnsToAdd) {
      plan.push({
        type: 'addColumn',
        tableName,
        column
      });
    }

    // Columns to drop
    const columnsToDrop = prevColumns.filter((col) => !nextColumnNames.includes(col.name));
    for (const column of columnsToDrop) {
      plan.push({
        type: 'dropColumn',
        tableName,
        columnName: column.name
      });
    }

    // Columns to modify
    const columnsToModify = nextColumns.filter((col) => prevColumnNames.includes(col.name));
    for (const column of columnsToModify) {
      const prevColumn = prevColumns.find((c) => c.name === column.name);
      if (prevColumn && columnsAreDifferent(prevColumn, column)) {
        plan.push({
          type: 'modifyColumn',
          tableName,
          column
        });
      }
    }
  }

  return plan;
}

// Helper function to determine if two columns are different
function columnsAreDifferent(col1: ColumnDefinition, col2: ColumnDefinition): boolean {
  return (
    col1.type !== col2.type ||
    col1.isNullable !== col2.isNullable ||
    col1.isPrimaryKey !== col2.isPrimaryKey ||
    col1.isUnique !== col2.isUnique
  );
}

// Function to apply a migration plan using the DB migration API
export async function applyMigrationPlan(db: DB, plan: MigrationPlan): Promise<void> {
  for (const step of plan) {
    switch (step.type) {
      case 'createTable':
        await db.schema.createTable(step.tableName, (table: any) => {
          for (const column of step.columns) {
            let col;
            switch (column.type) {
              case 'string':
                col = table.string(column.name);
                break;
              case 'number':
                col = table.integer(column.name);
                break;
              case 'date':
                col = table.date(column.name);
                break;
              case 'boolean':
                col = table.boolean(column.name);
                break;
              case 'uuid':
                col = table.uuid(column.name);
                break;
              // Add more types as needed
              default:
                col = table.string(column.name);
            }

            if (!column.isNullable) {
              col.notNullable();
            } else {
              col.nullable();
            }

            if (column.isPrimaryKey) {
              col.primary();
            }

            if (column.isUnique) {
              col.unique();
            }
          }
        });
        break;

      case 'dropTable':
        await db.schema.dropTable(step.tableName);
        break;

      case 'addColumn':
        await db.schema.table(step.tableName, (table: any) => {
          const column = step.column;
          let col;
          switch (column.type) {
            case 'string':
              col = table.string(column.name);
              break;
            case 'number':
              col = table.integer(column.name);
              break;
            case 'date':
              col = table.date(column.name);
              break;
            case 'boolean':
              col = table.boolean(column.name);
              break;
            case 'uuid':
              col = table.uuid(column.name);
              break;
            // Add more types as needed
            default:
              col = table.string(column.name);
          }

          if (!column.isNullable) {
            col.notNullable();
          } else {
            col.nullable();
          }

          if (column.isUnique) {
            col.unique();
          }
        });
        break;

      case 'dropColumn':
        await db.schema.table(step.tableName, (table: any) => {
          table.dropColumn(step.columnName);
        });
        break;

      case 'modifyColumn':
        // Note: Knex doesn't support modifying columns out of the box.
        // You might need to use a raw query or a plugin like knex.schema.alterTable.
        // Here's a simplified example using raw queries.

        // This is highly dependent on the database you're using.
        // Below is an example for PostgreSQL.

        // TODO: (now) Modify this part according to your DBMS.
        await db.schema.table(step.tableName, (_table: any) => {
          // This is a placeholder. Actual implementation may vary.
          // For example, in PostgreSQL:
          // table.string(column.name).notNullable().alter();
          // But Knex doesn't provide a direct way, so you might need to use raw SQL.
        });

        // Example using raw SQL for PostgreSQL:
        // await db.raw(`ALTER TABLE "${step.tableName}" ALTER COLUMN "${step.column.name}" TYPE ${mapColumnType(step.column.type)};`);
        // await db.raw(`ALTER TABLE "${step.tableName}" ALTER COLUMN "${step.column.name}" ${step.column.isNullable ? 'DROP NOT NULL' : 'SET NOT NULL'};`);

        // For demonstration, we'll skip the actual implementation.
        console.warn(
          `Modify column step for table ${step.tableName} and column ${step.column.name} is not implemented.`
        );
        break;

      default:
        throw new Error(`Unknown migration step type: ${(step as any).type}`);
    }
  }
}

import { type ColumnDataType, type ColumnDefinitionBuilder, Kysely, type Migration } from 'kysely';

/**
 * Helper function to add a column to the table.
 * @param table - The table to which the column is added.
 * @param column - The column definition.
 */
// function kyselyGetColumnType(type: string): typeof Kysely.parser.DataTypeExpression {
function kyselyGetColumnType(type: string): ColumnDataType {
  switch (type) {
    case 'string':
      return 'varchar';
    case 'text':
      return 'text';
    case 'number':
      return 'integer';
    case 'float':
      return 'float4';
    case 'decimal':
      return 'decimal'; // Example precision and scae
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'date';
    case 'uuid':
      return 'uuid';
    case 'json':
      return 'json';
    default:
      return 'varchar';
  }
}

function kyselyGetColumnAttributesCallback(column: ColumnDefinition) {
  return (colBuilder: ColumnDefinitionBuilder) => {
    // Apply constraints
    if (!column.isNullable) {
      colBuilder.notNull();
    }

    if (column.isPrimaryKey) {
      colBuilder.primaryKey();
    }

    if (column.isUnique) {
      colBuilder.unique();
    }
    return colBuilder;
  };
}

/**
 * Converts a MigrationPlan to a Kysely Migration.
 * @param plan - The migration plan to be executed.
 * @returns A Kysely Migration object.
 */
export function migrationPlanToKyselyMigration(plan: MigrationPlan): Migration {
  return {
    up: async (db: Kysely<any>) => {
      for (const step of plan) {
        switch (step.type) {
          case 'createTable':
            {
              let table = db.schema.createTable(step.tableName);
              step.columns.forEach((column) => {
                table = table.addColumn(
                  column.name,
                  kyselyGetColumnType(column.type),
                  kyselyGetColumnAttributesCallback(column)
                );
              });
              await table.execute();
            }
            break;

          case 'dropTable':
            await db.schema.dropTable(step.tableName).execute();
            break;

          case 'addColumn':
            // await db.schema
            //   .alterTable(step.tableName)
            //   .addColumn((table) => {
            //     const column = step.column;
            //     addColumnToTable(table, column);
            //   })
            //   .execute();

            await db.schema
              .alterTable(step.tableName)
              .addColumn(
                step.column.name,
                kyselyGetColumnType(step.column.type),
                kyselyGetColumnAttributesCallback(step.column)
              )
              .execute();

            break;

          case 'dropColumn':
            await db.schema.alterTable(step.tableName).dropColumn(step.columnName).execute();
            break;

          case 'modifyColumn':
            console.warn(
              `Modify column step for table "${step.tableName}" and column "${step.column.name}" is not implemented in Kysely.`
            );
            break;

          default:
            throw new Error(`Unknown migration step type: ${(step as any).type}`);
        }
      }
    },

    down: async (_db: Kysely<any>) => {
      console.warn('Down migrations are not implemented.');
    }
  };
}

/**
 * Generates Kysely migrations from schema history.
 * @param schemaHistory - The schema history with versioned schema changes.
 * @returns A record of Kysely-compatible migrations.
 */
export function generateKyselyMigrations(schemaHistory: DbSchemaHistory): {
  [key: string]: Migration;
} {
  // Extract version keys and sort them in ascending order (v1, v2, ...)
  const versions = Object.keys(schemaHistory) as Array<keyof DbSchemaHistory>;
  const sortedVersions = versions.toSorted((a, b) => {
    const numA = typeof a === 'string' ? parseInt(a.replace('v', ''), 10) : a;
    const numB = typeof b === 'string' ? parseInt(b.replace('v', ''), 10) : b;
    return numA - numB;
  });

  const migrations: { [key: string]: Migration } = {};
  let previousSchemaInfo: SchemaInfo = { tables: {} };
  for (const version of sortedVersions) {
    const { schema, planHook } = schemaHistory[version];
    const currentSchemaInfo = extractSchemaInfo(schema);
    let migrationPlan: MigrationPlan = compareSchemas(previousSchemaInfo, currentSchemaInfo);
    migrationPlan = planHook ? planHook(migrationPlan) : migrationPlan;
    const kyselyMigration = migrationPlanToKyselyMigration(migrationPlan);
    migrations[version] = kyselyMigration;
    previousSchemaInfo = currentSchemaInfo;
  }

  return migrations;
}

import type { Knex } from 'knex';

/**
 * Converts a MigrationPlan into a Knex Migration object.
 * @param plan - The migration plan detailing the steps to perform.
 * @returns A Knex.Migration object with up and down functions.
 */
export function migrationPlanToKnexMigration(plan: MigrationPlan): Knex.Migration {
  return {
    /**
     * Executes the migration plan using Knex schema methods.
     * @param knex - The Knex instance.
     */
    up: async (knex: Knex) => {
      for (const step of plan) {
        switch (step.type) {
          case 'createTable':
            await knex.schema.createTable(step.tableName, (table) => {
              step.columns.forEach((column) => {
                let colBuilder: Knex.ColumnBuilder;
                switch (column.type) {
                  case 'string':
                    colBuilder = table.string(column.name);
                    break;
                  case 'text':
                    colBuilder = table.text(column.name);
                    break;
                  case 'number':
                    colBuilder = table.integer(column.name);
                    break;
                  case 'float':
                    colBuilder = table.float(column.name);
                    break;
                  case 'decimal':
                    colBuilder = table.decimal(column.name, 10, 2); // Example precision and scale
                    break;
                  case 'boolean':
                    colBuilder = table.boolean(column.name);
                    break;
                  case 'date':
                    colBuilder = table.date(column.name);
                    break;
                  case 'uuid':
                    colBuilder = table.uuid(column.name);
                    break;
                  case 'json':
                    colBuilder = table.json(column.name);
                    break;
                  // Add more types as needed
                  default:
                    colBuilder = table.string(column.name);
                }

                // Apply constraints
                if (!column.isNullable) {
                  colBuilder.notNullable();
                } else {
                  colBuilder.nullable();
                }

                if (column.isPrimaryKey) {
                  colBuilder.primary();
                }

                if (column.isUnique) {
                  colBuilder.unique();
                }
              });
            });
            break;

          case 'dropTable':
            await knex.schema.dropTable(step.tableName);
            break;

          case 'addColumn':
            await knex.schema.table(step.tableName, (table) => {
              const column = step.column;
              let colBuilder: Knex.ColumnBuilder;
              switch (column.type) {
                case 'string':
                  colBuilder = table.string(column.name);
                  break;
                case 'text':
                  colBuilder = table.text(column.name);
                  break;
                case 'number':
                  colBuilder = table.integer(column.name);
                  break;
                case 'float':
                  colBuilder = table.float(column.name);
                  break;
                case 'decimal':
                  colBuilder = table.decimal(column.name, 10, 2); // Example precision and scale
                  break;
                case 'date':
                  colBuilder = table.date(column.name);
                  break;
                case 'boolean':
                  colBuilder = table.boolean(column.name);
                  break;
                case 'uuid':
                  colBuilder = table.uuid(column.name);
                  break;
                case 'json':
                  colBuilder = table.json(column.name);
                  break;
                // Add more types as needed
                default:
                  colBuilder = table.string(column.name);
              }

              // Apply constraints
              if (!column.isNullable) {
                colBuilder.notNullable();
              } else {
                colBuilder.nullable();
              }

              if (column.isUnique) {
                colBuilder.unique();
              }
            });
            break;

          case 'dropColumn':
            await knex.schema.table(step.tableName, (table) => {
              table.dropColumn(step.columnName);
            });
            break;

          case 'modifyColumn':
            // Note: Knex doesn't support modifying columns out of the box.
            // You might need to use a raw query or a plugin like knex.schema.alterTable.
            // Here's a simplified example using raw queries.

            // This is highly dependent on the database you're using.
            // Below is an example for PostgreSQL.

            // TODO: (now) Modify this part according to your DBMS.
            await knex.schema.table(step.tableName, (_table) => {
              // Placeholder for modifyColumn implementation
              // For example, in PostgreSQL:
              // table.string(column.name).notNullable().alter();
              // But Knex doesn't provide a direct way, so you might need to use raw SQL.
            });

            // Example using raw SQL for PostgreSQL:
            // await knex.raw(`ALTER TABLE "${step.tableName}" ALTER COLUMN "${step.column.name}" TYPE ${mapColumnType(step.column.type)};`);
            // await knex.raw(`ALTER TABLE "${step.tableName}" ALTER COLUMN "${step.column.name}" ${step.column.isNullable ? 'DROP NOT NULL' : 'SET NOT NULL'};`);

            // For demonstration, we'll skip the actual implementation.
            console.warn(
              `Modify column step for table "${step.tableName}" and column "${step.column.name}" is not implemented.`
            );
            break;

          default:
            throw new Error(`Unknown migration step type: ${(step as any).type}`);
        }
      }
    },

    /**
     * Stubbed down migration function.
     * Requires previous schema details to implement.
     * @param knex - The Knex instance.
     */
    down: async (_knex: Knex) => {
      // Stub: Implement down migrations with previous schema details
      console.warn('Down migrations are not implemented.');
    }
  };
}

/**
 * Generates Knex Migration objects based on the provided dbSchemaHistory.
 *
 * Each migration corresponds to the changes from the previous version to the current version.
 * The `down()` functions are stubbed as per requirement.
 *
 * @param schemaHistory - The history of database schemas and plan hooks.
 * @returns An array of Knex.Migration objects.
 */
export function generateKnexMigrations(schemaHistory: DbSchemaHistory): {
  [key: string]: Knex.Migration;
} {
  // Extract version keys and sort them in ascending order (v1, v2, ...)
  const versions = Object.keys(schemaHistory) as Array<keyof DbSchemaHistory>;
  const sortedVersions = versions.toSorted((a, b) => {
    const numA = typeof a === 'string' ? parseInt(a.replace('v', ''), 10) : a;
    const numB = typeof b === 'string' ? parseInt(b.replace('v', ''), 10) : b;
    return numA - numB;
  });

  const migrations: { [key: string]: Knex.Migration } = {};
  let previousSchemaInfo: SchemaInfo = { tables: {} };
  for (const version of sortedVersions) {
    const { schema, planHook } = schemaHistory[version];
    const currentSchemaInfo = extractSchemaInfo(schema);
    let migrationPlan: MigrationPlan = compareSchemas(previousSchemaInfo, currentSchemaInfo);
    migrationPlan = planHook ? planHook(migrationPlan) : migrationPlan;
    const knexMigration = migrationPlanToKnexMigration(migrationPlan);
    migrations[version] = knexMigration;
    previousSchemaInfo = currentSchemaInfo;
  }

  return migrations;
}

// The main migration function
export async function migrateSchema(
  db: DB,
  currentVersion: SchemaVersion,
  targetVersion: SchemaVersion
): Promise<void> {
  const versions = Object.keys(dbSchemaHistory) as SchemaVersion[];

  const currentIndex = versions.indexOf(currentVersion);
  const targetIndex = versions.indexOf(targetVersion);

  if (currentIndex === -1) {
    throw new Error(`Current version "${currentVersion}" is not a valid schema version.`);
  }

  if (targetIndex === -1) {
    throw new Error(`Target version "${targetVersion}" is not a valid schema version.`);
  }

  if (currentIndex > targetIndex) {
    throw new Error(
      `Downgrading schema versions is not supported. Current: ${currentVersion}, Target: ${targetVersion}`
    );
  }

  // Iterate through each version step
  for (let i = currentIndex; i < targetIndex; i++) {
    const fromVersion = versions[i];
    const toVersion = versions[i + 1];

    const fromSchema = extractSchemaInfo(dbSchemaHistory[fromVersion].schema);
    const toSchema = extractSchemaInfo(dbSchemaHistory[toVersion].schema);

    let plan = compareSchemas(fromSchema, toSchema);
    const planHook = dbSchemaHistory[toVersion].planHook;
    plan = planHook ? planHook(plan) : plan;

    await applyMigrationPlan(db, plan);
  }
}

// Example usage: migration from v1 to v2
export async function exampleMigration() {
  // Mock implementation of DB interface for demonstration purposes
  const mockDB: DB = {
    schema: {
      createTable: async (tableName: string, callback: (table: any) => void) => {
        console.log(`Creating table: ${tableName}`);
        // Implement actual table creation logic here
        callback({});
      },
      dropTable: async (tableName: string) => {
        console.log(`Dropping table: ${tableName}`);
        // Implement actual table dropping logic here
      },
      table: async (tableName: string, callback: (table: any) => void) => {
        console.log(`Altering table: ${tableName}`);
        // Implement actual table alteration logic here
        callback({});
      }
    },
    migrate: async (plan: MigrationPlan) => {
      console.log(`Executing migration plan: ${JSON.stringify(plan, null, 2)}`);
      // Implement actual migration execution logic here
    }
  };

  try {
    await migrateSchema(mockDB, 'v1', 'v2');
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
