import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import type { DalConfig, Schema } from '$lib/dal/dal-types';
import { createDatabase, getDatabase, closeDatabase, __setDatabase } from './dal';
import { KnexSqliteDatabase } from './dal-knex-sqlite';
import { KyselySqliteDatabase } from './dal-kysely-sqlite';
import { dbSchema as defaultSchema } from '$lib/db-schema';

vi.mock('./dal-knex-sqlite', () => ({ KnexSqliteDatabase: vi.fn() }));
vi.mock('./dal-kysely-sqlite', () => ({ KyselySqliteDatabase: vi.fn() }));

// Mock the environment variables
const DEFAULT_IMPLEMENTATION = 'knex-sqlite';
vi.mock('$env/static/private', () => ({
  // Using variables does not work here (vi.mock()'s are hoisted to the top):
  // DB_IMPLEMENTATION: DEFAULT_IMPLEMENTATION
  DB_IMPLEMENTATION: 'knex-sqlite',
  DB_SQLITE_FILE: 'testdb.sqlite'
}));

beforeEach(() => {
  vi.clearAllMocks();
  __setDatabase(null);
});

describe.each([
  { implementation: 'default', className: 'KnexSqliteDatabase', instance: KnexSqliteDatabase },
  { implementation: 'knex-sqlite', className: 'KnexSqliteDatabase', instance: KnexSqliteDatabase },
  {
    implementation: 'kysely-sqlite',
    className: 'KyselySqliteDatabase',
    instance: KyselySqliteDatabase
  }
])(
  'dal.ts with DB_IMPLEMENTATION=$implementation ($className)',
  ({
    implementation,
    className: _className,
    instance
  }: {
    implementation: string;
    className: string;
    instance: any;
  }) => {
    beforeEach(async () => {
      //   vi.clearAllMocks();
      //   __setDatabase(null);
      const env = await import('$env/static/private');
      const impl = implementation === 'default' ? DEFAULT_IMPLEMENTATION : implementation;
      env.DB_IMPLEMENTATION = impl;
      process.env.DB_IMPLEMENTATION = impl;
      process.env.DB_SQLITE_FILE = env.DB_SQLITE_FILE; // Mocked value
    });
    afterEach(() => {
      delete process.env.DB_IMPLEMENTATION; // Clean up after test
    });
    describe('createDatabase', () => {
      it(`should create a ${_className} by default`, () => {
        const mockSchema: Schema = defaultSchema;
        const mockConfig: DalConfig = { implementation } as unknown as DalConfig;
        createDatabase(mockConfig, mockSchema);
        expect(instance).toHaveBeenCalledWith(process.env.DB_SQLITE_FILE, mockSchema);
      });

      it('should use the dbFilePath from config when provided', () => {
        const mockSchema: Schema = defaultSchema;
        const mockConfig: DalConfig = {
          implementation,
          dbFilePath: 'custom.sqlite'
        } as unknown as DalConfig;
        createDatabase(mockConfig, mockSchema);
        expect(instance).toHaveBeenCalledWith('custom.sqlite', mockSchema);
      });

      it('should throw an error when postgres is selected as the implementation', () => {
        const mockSchema: Schema = defaultSchema;
        const mockConfig: DalConfig = { implementation: 'postgres' } as unknown as DalConfig;
        expect(() => createDatabase(mockConfig, mockSchema)).toThrow(
          'Postgres backend not yet implemented'
        );
      });

      it('should fallback to the environment variable for DB_IMPLEMENTATION', () => {
        const mockSchema: Schema = defaultSchema;
        const mockConfig: DalConfig = {};
        createDatabase(mockConfig, mockSchema);
        expect(instance).toHaveBeenCalledWith(process.env.DB_SQLITE_FILE, mockSchema);
      });
    });

    describe('getDatabase', () => {
      it('should return the same instance if called multiple times', async () => {
        const mockSchema: Schema = defaultSchema;
        const mockConfig: DalConfig = { implementation } as unknown as DalConfig;
        const db1 = await getDatabase(mockConfig, mockSchema);
        const db2 = await getDatabase(mockConfig, mockSchema);
        expect(db1).toBe(db2);
        expect(instance).toHaveBeenCalledTimes(1);
      });

      it('should create a new database instance if none exists', async () => {
        const mockSchema: Schema = defaultSchema;
        const mockConfig: DalConfig = { implementation } as unknown as DalConfig;
        const db = await getDatabase(mockConfig, mockSchema);
        expect(instance).toHaveBeenCalledWith(process.env.DB_SQLITE_FILE, mockSchema);
        expect(db).toBeTruthy();
      });
    });

    describe('closeDatabase', () => {
      it('should close the database and set it to null', async () => {
        const mockSchema: Schema = defaultSchema;
        const mockConfig: DalConfig = { implementation } as unknown as DalConfig;
        const mockClose = vi.fn();
        const mockDb1 = { close: mockClose };
        instance.mockImplementationOnce(() => mockDb1);
        const db1 = await getDatabase(mockConfig, mockSchema);
        expect(db1).toBe(mockDb1);
        await closeDatabase();
        expect(mockClose).toHaveBeenCalled();
        const mockDb2 = { close: mockClose }; // New mock for the second instance
        instance.mockImplementationOnce(() => mockDb2);
        const db2 = await getDatabase(mockConfig, mockSchema);
        expect(db2).toBe(mockDb2);
        expect(db2).not.toBe(mockDb1);
      });

      it('should do nothing if there is no active database', async () => {
        await closeDatabase();
        expect(instance).not.toHaveBeenCalled();
      });
    });
  }
);
