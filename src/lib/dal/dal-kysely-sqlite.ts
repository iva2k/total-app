import { Kysely, SqliteDialect, Migrator, type Migration, type MigrationProvider } from 'kysely';
// import { type Database as SqliteDatabase } from 'better-sqlite3';
import SqliteDatabase from 'better-sqlite3';
import type { IDatabase, Entity, Schema, ITransaction, DbSchemaHistory } from '$lib/dal/dal-types';
import { generateKyselyMigrations } from '$lib/dal/dal-migration';
import { dbSchemaHistory } from '$lib/db-schema';
import fs from 'fs';
import { errorifyAnyError, stringifyAnyError } from '$lib/utils/errorUtils';

// Define a Kysely MigrationProvider using Knex-based migrations
export class CustomMigrationProvider implements MigrationProvider {
  private readonly migrations: Record<string, Migration>;

  constructor(schemaHistory: DbSchemaHistory) {
    // Generate migrations from the schema history using Knex logic
    this.migrations = generateKyselyMigrations(schemaHistory) as unknown as Record<
      string,
      Migration
    >;
  }

  async getMigrations(): Promise<Record<string, Migration>> {
    return this.migrations;
  }

  // Get the migration object for a specific migration by name
  async getMigration(migrationName: string): Promise<Migration> {
    const migrationFunctions = this.migrations?.[migrationName];

    if (!migrationFunctions) {
      throw new Error(`Migration "${migrationName}" not found.`);
    }

    return migrationFunctions;
  }
}

export class KyselySqliteDatabase<TDatabase> implements IDatabase<TDatabase> {
  private db: Kysely<any> | null = null;
  private txn: Kysely<any> | null = null;
  private resolveTransaction: ((value: void | PromiseLike<void>) => void) | null;
  private rejectTransaction: ((reason?: any) => void) | null;
  private initialized = false;

  constructor(
    private readonly dbFilePath: string,
    private readonly schema: Schema
  ) {
    // Initialize Kysely with SQLite dialect
    this.db = new Kysely<TDatabase>({
      dialect: new SqliteDialect({
        database: new SqliteDatabase(this.dbFilePath)
      })
    });
    this.txn = this.db;
    this.resolveTransaction = null;
    this.rejectTransaction = null;
  }

  // Initialize the database, run migrations, and seed data if needed
  async initialize(seed?: (db: IDatabase<TDatabase>, dbFilePath: string) => Promise<void>) {
    if (!this.db) return;
    if (this.initialized) return; // Already initialized
    const dbExisted = this.dbFilePath === ':memory:' ? false : fs.existsSync(this.dbFilePath);

    // private migrator: Migrator | null = null;
    const migrator = new Migrator({
      db: this.db,
      provider: new CustomMigrationProvider(dbSchemaHistory)
    });

    try {
      // Run all pending migrations
      const { error, results } = (await migrator?.migrateToLatest()) ?? {};

      if (error) {
        console.error('Migration failed:', error);
        throw errorifyAnyError(error);
      }

      console.log(`Migrations applied:`, results);

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
      console.error('An error occurred during initialization:', error);
      throw errorifyAnyError(error);
    }
  }

  // Close the database connection
  async close(): Promise<void> {
    if (this.db) {
      if (this.txn && this.txn !== this.db && 'commit' in this.txn) {
        await (this.txn as { commit: () => Promise<void> }).commit();
        this.txn = null;
        this.resolveTransaction = null;
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

    // Since Kysely transaction is callback-based with all actions expected in the callback, we need to "promisify" it:
    // 1. We setup a Promise `txnResolver` and stash the transaction context, so we can handle resolve/reject logic from our commit()/rollback() methods.
    // 2. Callback in .transaction().execute() is not called immediately, so we need Promise `txnInited` for waiting for `this.txn` to receive the transaction context.
    // 3. Start the transaction and save it in `txnPromise`, but don't commit/rollback until instructed.
    let txnPromise: Promise<void> | null = null;
    const txnResolver = new Promise<void>((resolve, reject) => {
      this.resolveTransaction = resolve;
      this.rejectTransaction = reject;
    });
    const txnInited = new Promise<void>((resolve, reject) => {
      if (!this.db) {
        const err = new Error('db not open');
        reject(err);
        throw err;
      }
      txnPromise = this.db.transaction().execute(async (trx) => {
        // Store the txn context and Wait until commit or rollback is called
        this.txn = trx;
        resolve();
        return txnResolver;
      });
    });
    await txnInited;

    return {
      commit: async () => {
        this.resolveTransaction?.();
        this.txn = this.db;
        this.resolveTransaction = null;
        this.rejectTransaction = null;
        await txnPromise;
      },
      rollback: async () => {
        this.rejectTransaction?.(new Error('Transaction rolled back')); // Reject the `txnResolver` to rollback
        this.txn = this.db;
        this.resolveTransaction = null;
        this.rejectTransaction = null;
        await txnPromise?.catch((_e) => {}); // Rejection will throw error, we need to swallow it.
      },
      findById: this.findById.bind(this),
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
      const result = await this.txn
        .selectFrom(entityName)
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      return result as T | null;
    } catch (error) {
      console.error(`Failed to find ${entityName} by ID:`, error);
      throw new Error(`Failed to find ${entityName} by ID: ${(error as Error).message}`);
    }
  }

  async findAll<T extends Entity>(entityName: string): Promise<T[]> {
    if (!this.txn) {
      throw new Error('Database connection is not open');
    }
    try {
      const results = await this.txn.selectFrom(entityName).selectAll().execute();
      return results as T[];
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
      await this.txn.insertInto(entityName).values(entity).execute();
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
      await this.txn.updateTable(entityName).set(entity).where('id', '=', entity.id).execute();
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
      await this.txn.deleteFrom(entityName).where('id', '=', id).execute();
    } catch (error) {
      console.error(`Failed to delete ${entityName} with ID ${id}:`, error);
      throw new Error(`Failed to delete ${entityName} with ID ${id}: ${(error as Error).message}`);
    }
  }
}
