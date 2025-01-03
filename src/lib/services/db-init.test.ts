import fs from 'fs';
import { initializeDatabase } from './db-init';
import { getDatabase, __setDatabase } from '../dal/dal';
import * as dbSchemaModule from '$lib/db-schema';
const { dbConfig, seedDevData } = dbSchemaModule;
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { DalConfig } from '$lib/dal/dal-types';
// import { KnexSqliteDatabase } from './dal-knex-sqlite';

// Mock the external dependencies
vi.mock('$lib/db-schema', async () => ({
  ...(await vi.importActual('$lib/db-schema')),
  seedDevData: vi.fn(),
  seedProductionData: vi.fn(),
  dbConfig: {
    implementation: 'knex-sqlite',
    // dbFilePath: 'test-database.sqlite'
    dbFilePath: ':memory:'
  } as DalConfig
}));

// Mocking KnexSqliteDatabase methods
vi.mock(import('../dal/dal-knex-sqlite'), async (importOriginal) => {
  const actual = await importOriginal();
  // const KnexSqliteDatabase = {
  //   ...actual.KnexSqliteDatabase,
  // transaction: vi.fn().mockResolvedValue({}),
  //   close: vi.fn().mockResolvedValue(undefined),
  // };

  return {
    __esmodule: true,
    ...actual
    // KnexSqliteDatabase
  } as unknown as typeof import('../dal/dal-knex-sqlite');
});

describe('initializeDatabase', () => {
  let mockDb: any;

  beforeEach(async () => {
    // Remove db file
    if (dbConfig.dbFilePath && fs.existsSync(dbConfig.dbFilePath)) {
      await fs.promises.unlink(dbConfig.dbFilePath);
    }
    // Reset the singleton `IDatabase` before each test
    __setDatabase(null);

    // Reset spies
    vi.clearAllMocks();

    mockDb = await getDatabase();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize the database in development mode and seed data', async () => {
    process.env.NODE_ENV = 'development';
    const consoleSpy = vi.spyOn(console, 'log');
    const spyTransaction = vi.spyOn(mockDb, 'transaction');
    const spySeedDevData = vi.spyOn(dbSchemaModule, 'seedDevData');
    const spySeedProductionData = vi.spyOn(dbSchemaModule, 'seedProductionData');

    await initializeDatabase();

    expect(spyTransaction).toHaveBeenCalled();
    expect(spySeedDevData).toHaveBeenCalledWith(mockDb);
    expect(spySeedProductionData).not.toHaveBeenCalledWith(mockDb);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Database file created. Initial data seeded for development environment.'
    );
  });

  it('should initialize the database in production mode and seed data', async () => {
    process.env.NODE_ENV = 'production';
    const consoleSpy = vi.spyOn(console, 'log');
    const spyTransaction = vi.spyOn(mockDb, 'transaction');
    const spySeedDevData = vi.spyOn(dbSchemaModule, 'seedDevData');
    const spySeedProductionData = vi.spyOn(dbSchemaModule, 'seedProductionData');

    await initializeDatabase();

    expect(spyTransaction).toHaveBeenCalled();
    expect(spySeedDevData).not.toHaveBeenCalledWith(mockDb);
    expect(spySeedProductionData).toHaveBeenCalledWith(mockDb);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Database file created. Initial data seeded for production environment.'
    );
  });

  it('should initialize the database in test mode and skip data seeding', async () => {
    process.env.NODE_ENV = 'test';
    const consoleSpy = vi.spyOn(console, 'log');
    const spyTransaction = vi.spyOn(mockDb, 'transaction');
    const spySeedDevData = vi.spyOn(dbSchemaModule, 'seedDevData');
    const spySeedProductionData = vi.spyOn(dbSchemaModule, 'seedProductionData');

    await initializeDatabase();

    expect(spyTransaction).toHaveBeenCalled();
    expect(spySeedDevData).not.toHaveBeenCalledWith(mockDb);
    expect(spySeedProductionData).not.toHaveBeenCalledWith(mockDb);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Database file created. Skipping data seeding for test environment.'
    );
  });

  it('should log an error and rollback the transaction if seeding fails', async () => {
    process.env.NODE_ENV = 'development';
    const consoleSpy = vi.spyOn(console, 'error');
    // TODO: (now) const spyRollback = vi.spyOn(mockDb, 'rollback');
    (seedDevData as Mock).mockRejectedValue(new Error('Seeding error'));

    await initializeDatabase();

    expect(seedDevData).toHaveBeenCalledWith(mockDb);
    // TODO: (now) expect(spyRollback).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'An error occurred during database initialization:',
      'Seeding error'
    );
  });
});
