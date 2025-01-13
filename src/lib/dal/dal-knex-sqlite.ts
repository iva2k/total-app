import knex, { type Knex } from 'knex';
import type { IDatabase, Entity, Schema, ITransaction } from '$lib/dal/dal-types';
import { dbSchemaHistory } from '$lib/db-schema';
import fs from 'fs';
import { generateKnexMigrations } from '$lib/dal/dal-migration';
import { stringifyAnyError } from '$lib/utils/errorUtils';

export class KnexSqliteDatabase<TDatabase> implements IDatabase<TDatabase> {
  private db: Knex | null = null;
  private txn: Knex | Knex.Transaction | null = null;
  private initialized = false;
  private migrations: { [key: string]: Knex.Migration } | null = null;

  constructor(
    private readonly dbFilePath: string,
    private readonly schema: Schema
  ) {
    const config: Knex.Config = {
      client: 'sqlite3',
      connection: {
        filename: this.dbFilePath
      },
      migrations: {
        migrationSource: {
          getMigrations: async () => {
            return Object.keys(this.getMigrations()).map((name) => ({ name }));
          },
          getMigrationName: (migration: any) => migration.name,
          getMigration: async (migration: any) => {
            const migrationFunctions = this.getMigrations()[migration.name];
            if (!migrationFunctions) {
              throw new Error(`Migration "${migration.name}" not found.`);
            }
            return migrationFunctions;
          }
        }
      },
      useNullAsDefault: true
    };
    this.db = knex(config);
    this.txn = this.db;
  }

  getMigrations() {
    this.migrations = this.migrations ?? generateKnexMigrations(dbSchemaHistory);
    return this.migrations;
  }

  // Initialize the database, run migrations, and seed data if needed
  async initialize(seed?: (db: IDatabase<TDatabase>, dbFilePath: string) => Promise<void>) {
    if (!this.db) return;
    if (this.initialized) return; // Already initialized
    const dbExisted = this.dbFilePath === ':memory:' ? false : fs.existsSync(this.dbFilePath);
    const currentVersion = dbExisted ? await this.db.migrate.currentVersion() : undefined;
    if (dbExisted) {
      console.log(`Current database schema version: ${currentVersion}`);
      const migrationList = await this.db.migrate.list();
      const [_completedMigrations, pendingMigrations] = migrationList;

      if (pendingMigrations.length > 0) {
        console.log(`Pending migrations detected. Running migrations...`);
        await this.db.migrate.latest();
      } else {
        console.log(`No pending migrations. Database is up-to-date.`);
      }
    } else {
      await this.db.migrate.latest();
    }
    try {
      await this.transaction().then(async (txn) => {
        try {
          if (!dbExisted && seed) {
            console.log(`Seeding data for the first time in database at "${this.dbFilePath}"...`);
            await seed(this, this.dbFilePath); // Pass the seed function
          }
          await txn.commit();

          this.initialized = true;
        } catch (error) {
          await txn.rollback();
          console.error('Database initialization failed:', error);
          throw new Error(`Database initialization failed: ${stringifyAnyError(error)}`);
        }
      });
    } catch (error) {
      console.error('An error occurred during database initialization:', error);
    }
  }

  // Close the database connection
  async close(): Promise<void> {
    if (this.db) {
      if (this.txn && this.txn !== this.db && 'commit' in this.txn) {
        await this.txn.commit();
        this.txn = null;
      }
      await this.db.destroy();
      this.db = null;
      this.initialized = false;
    }
  }

  async transaction(): Promise<ITransaction<TDatabase>> {
    if (!this.db) {
      throw new Error('Database connection is not open');
    }
    const trx: Knex.Transaction = await this.db.transaction();
    this.txn = trx;
    return {
      commit: async () => {
        await trx.commit();
        this.txn = this.db;
      },
      rollback: async () => {
        await trx.rollback();
        this.txn = this.db;
      },
      findById: this.findById.bind(this),
      findOne: this.findOne.bind(this),
      findAll: this.findAll.bind(this),
      create: this.create.bind(this),
      update: this.update.bind(this),
      delete: this.delete.bind(this)
    };
  }

  async findById<T extends Entity>(entityName: string, id: string): Promise<T | null> {
    if (!this.txn) {
      throw new Error('Database connection is not open');
    }
    try {
      const row = await this.txn(entityName).where({ id }).first();
      return row ?? null;
    } catch (error) {
      console.error(`Failed to find ${entityName} by ID:`, error);
      throw new Error(`Failed to find ${entityName} by ID: ${(error as Error).message}`);
    }
  }

  async findOne<T extends Entity>(entityName: string, entity: Partial<T>): Promise<T | null> {
    if (!this.txn) {
      throw new Error('Database connection is not open');
    }
    try {
      // Build the where clause based on the provided entity object
      const query = this.txn(entityName);
      Object.entries(entity).forEach(([key, value]) => {
        query.where(key, value);
      });
      const row = await query.first();
      return row ?? null;
    } catch (error) {
      console.error(`Failed to find ${entityName} by given props:`, error);
      throw new Error(`Failed to find ${entityName} by given props: ${(error as Error).message}`);
    }
  }

  async findAll<T extends Entity>(entityName: string): Promise<T[]> {
    if (!this.txn) {
      throw new Error('Database connection is not open');
    }
    try {
      return await this.txn(entityName).select();
    } catch (error) {
      console.error(`Failed to retrieve all ${entityName} records:`, error);
      throw new Error(`Failed to retrieve all ${entityName} records: ${(error as Error).message}`);
    }
  }

  async create<T extends Entity>(entityName: string, entity: T): Promise<T> {
    if (!this.txn) {
      throw new Error('Database connection is not open');
    }
    try {
      await this.txn(entityName).insert(entity);
      return entity;
    } catch (error) {
      console.error(`Failed to create ${entityName}:`, error);
      throw new Error(`Failed to create ${entityName}: ${(error as Error).message}`);
    }
  }

  async update<T extends Entity>(entityName: string, entity: T): Promise<T> {
    if (!this.txn) {
      throw new Error('Database connection is not open');
    }
    try {
      await this.txn(entityName).where({ id: entity.id }).update(entity);
      return entity;
    } catch (error) {
      console.error(`Failed to update ${entityName}:`, error);
      throw new Error(`Failed to update ${entityName}: ${(error as Error).message}`);
    }
  }

  async delete(entityName: string, id: string): Promise<void> {
    if (!this.txn) {
      throw new Error('Database connection is not open');
    }
    try {
      await this.txn(entityName).where({ id }).del();
    } catch (error) {
      console.error(`Failed to delete ${entityName} with ID ${id}:`, error);
      throw new Error(`Failed to delete ${entityName} with ID ${id}: ${(error as Error).message}`);
    }
  }
}
