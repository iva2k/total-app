import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeEach,
  type Mock,
  type MockInstance
} from 'vitest';
import { z } from 'zod';

import type { DbSchemaHistory, MigrationPlan, Schema } from '$lib/dal/dal-types';
import {
  applyMigrationPlan,
  compareSchemas,
  extractSchemaInfo,
  migrationPlanToKnexMigration,
  generateKnexMigrations,
  type DB,
  type SchemaInfo,
  type ColumnDefinition
} from './dal-migration';

describe('extractSchemaInfo', () => {
  it('should correctly extract schema information for a single table with various column types', () => {
    const userSchema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        passwordHash: z.string(),
        name: z.string().optional(),
        isActive: z.boolean(),
        createdAt: z.date()
      })
    };

    const expectedSchemaInfo: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'passwordHash', type: 'string', isNullable: false },
          { name: 'name', type: 'string', isNullable: true },
          { name: 'isActive', type: 'boolean', isNullable: false },
          { name: 'createdAt', type: 'date', isNullable: false }
        ]
      }
    };

    const result = extractSchemaInfo(userSchema);
    expect(result).toEqual(expectedSchemaInfo);
  });

  it('should handle multiple tables with different column configurations', () => {
    const multiTableSchema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        passwordHash: z.string(),
        name: z.string().optional()
      }),
      Post: z.object({
        id: z.string().uuid(),
        title: z.string(),
        content: z.string().optional(),
        published: z.boolean().optional(),
        authorId: z.string().uuid()
      })
    };

    const expectedSchemaInfo: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'passwordHash', type: 'string', isNullable: false },
          { name: 'name', type: 'string', isNullable: true }
        ],
        Post: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false },
          { name: 'content', type: 'string', isNullable: true },
          { name: 'published', type: 'boolean', isNullable: true },
          { name: 'authorId', type: 'uuid', isNullable: false }
        ]
      }
    };

    const result = extractSchemaInfo(multiTableSchema);
    expect(result).toEqual(expectedSchemaInfo);
  });

  it('should return an empty schema info when provided with an empty schema', () => {
    const emptySchema = {};

    const expectedSchemaInfo: SchemaInfo = {
      tables: {}
    };

    const result = extractSchemaInfo(emptySchema);
    expect(result).toEqual(expectedSchemaInfo);
  });

  it('should ignore non-ZodObject schemas', () => {
    const mixedSchema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email()
      }),
      config: z.string(), // Non-object schema, should be ignored
      settings: z.number() // Non-object schema, should be ignored
    };

    const expectedSchemaInfo: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ]
      }
    };

    const result = extractSchemaInfo(mixedSchema);
    expect(result).toEqual(expectedSchemaInfo);
  });

  it('should correctly identify nullable fields', () => {
    const nullableSchema = {
      Product: z.object({
        id: z.string().uuid(),
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        inStock: z.boolean().optional()
      })
    };

    const expectedSchemaInfo: SchemaInfo = {
      tables: {
        Product: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'string', isNullable: false },
          { name: 'description', type: 'string', isNullable: true },
          { name: 'price', type: 'number', isNullable: false },
          { name: 'inStock', type: 'boolean', isNullable: true }
        ]
      }
    };

    const result = extractSchemaInfo(nullableSchema);
    expect(result).toEqual(expectedSchemaInfo);
  });

  it('should default to string type for unrecognized Zod types', () => {
    const unknownTypeSchema = {
      Inventory: z.object({
        id: z.string().uuid(),
        metadata: z.any(), // Unrecognized type
        tags: z.array(z.string()) // Unrecognized type
      })
    };

    const expectedSchemaInfo: SchemaInfo = {
      tables: {
        Inventory: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'metadata', type: 'string', isNullable: true }, // Defaults to 'string'. ZodAny type is Nullable.
          { name: 'tags', type: 'string', isNullable: false } // Defaults to 'string'
        ]
      }
    };

    const result = extractSchemaInfo(unknownTypeSchema);
    expect(result).toEqual(expectedSchemaInfo);
  });

  it('should correctly handle tables with no columns', () => {
    const emptyTableSchema = {
      EmptyTable: z.object({})
    };

    const expectedSchemaInfo: SchemaInfo = {
      tables: {
        EmptyTable: []
      }
    };

    const result = extractSchemaInfo(emptyTableSchema);
    expect(result).toEqual(expectedSchemaInfo);
  });
});

describe('compareSchemas', () => {
  it('should return an empty migration plan when schemas are identical', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'name', type: 'string', isNullable: true }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'name', type: 'string', isNullable: true }
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    expect(plan).toEqual([]);
  });

  it('should identify tables to create', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ],
        Post: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false },
          { name: 'content', type: 'string', isNullable: true }
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'createTable',
        tableName: 'Post',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false },
          { name: 'content', type: 'string', isNullable: true }
        ]
      }
    ];

    expect(plan).toEqual(expectedPlan);
  });

  it('should identify tables to drop', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ],
        Post: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'dropTable',
        tableName: 'Post'
      }
    ];

    expect(plan).toEqual(expectedPlan);
  });

  it('should identify both tables to create and drop', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ],
        Comment: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'text', type: 'string', isNullable: false }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ],
        Post: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false }
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'createTable',
        tableName: 'Post',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false }
        ]
      },
      {
        type: 'dropTable',
        tableName: 'Comment'
      }
    ];

    expect(plan).toEqual(expectedPlan);
    // Since the order may vary, assert that both steps are present regardless of order
    expect(plan).toHaveLength(2);
    expect(plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'createTable',
          tableName: 'Post'
        }),
        expect.objectContaining({
          type: 'dropTable',
          tableName: 'Comment'
        })
      ])
    );
  });

  it('should identify columns to add within existing tables', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'name', type: 'string', isNullable: true }
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'addColumn',
        tableName: 'User',
        column: { name: 'name', type: 'string', isNullable: true }
      }
    ];

    expect(plan).toEqual(expectedPlan);
  });

  it('should identify columns to drop within existing tables', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'name', type: 'string', isNullable: true }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'dropColumn',
        tableName: 'User',
        columnName: 'name'
      }
    ];

    expect(plan).toEqual(expectedPlan);
  });

  it('should identify columns to modify within existing tables', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'age', type: 'number', isNullable: true }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'age', type: 'number', isNullable: false } // Changed isNullable from true to false
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'modifyColumn',
        tableName: 'User',
        column: { name: 'age', type: 'number', isNullable: false }
      }
    ];

    expect(plan).toEqual(expectedPlan);
  });

  it('should handle mixed changes: create/drop tables and add/drop/modify columns', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'age', type: 'number', isNullable: true }
        ],
        Post: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false },
          { name: 'content', type: 'string', isNullable: true }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'age', type: 'number', isNullable: false }, // Modified
          { name: 'name', type: 'string', isNullable: true } // Added
        ],
        Comment: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'text', type: 'string', isNullable: false }
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'createTable',
        tableName: 'Comment',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'text', type: 'string', isNullable: false }
        ]
      },
      {
        type: 'dropTable',
        tableName: 'Post'
      },
      {
        type: 'addColumn',
        tableName: 'User',
        column: { name: 'name', type: 'string', isNullable: true }
      },
      {
        type: 'modifyColumn',
        tableName: 'User',
        column: { name: 'age', type: 'number', isNullable: false }
      }
    ];

    expect(plan).toEqual(expectedPlan);
    // Since the order may vary, assert that all steps are present
    expect(plan).toHaveLength(4);
    expect(plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'createTable',
          tableName: 'Comment'
        }),
        expect.objectContaining({
          type: 'dropTable',
          tableName: 'Post'
        }),
        expect.objectContaining({
          type: 'addColumn',
          tableName: 'User',
          column: { name: 'name', type: 'string', isNullable: true }
        }),
        expect.objectContaining({
          type: 'modifyColumn',
          tableName: 'User',
          column: { name: 'age', type: 'number', isNullable: false }
        })
      ])
    );
  });

  it('should handle empty previous schema (all tables are new)', () => {
    const schemaA: SchemaInfo = {
      tables: {}
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ],
        Post: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false }
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'createTable',
        tableName: 'User',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ]
      },
      {
        type: 'createTable',
        tableName: 'Post',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false }
        ]
      }
    ];

    expect(plan).toEqual(expectedPlan);
    // Order may vary; use arrayContaining
    expect(plan).toHaveLength(2);
    expect(plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'createTable',
          tableName: 'User'
        }),
        expect.objectContaining({
          type: 'createTable',
          tableName: 'Post'
        })
      ])
    );
  });

  it('should handle empty next schema (all tables are dropped)', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ],
        Post: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {}
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'dropTable',
        tableName: 'User'
      },
      {
        type: 'dropTable',
        tableName: 'Post'
      }
    ];

    expect(plan).toEqual(expectedPlan);
    // Order may vary; use arrayContaining
    expect(plan).toHaveLength(2);
    expect(plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'dropTable',
          tableName: 'User'
        }),
        expect.objectContaining({
          type: 'dropTable',
          tableName: 'Post'
        })
      ])
    );
  });

  it('should handle multiple columns being added, dropped, and modified across multiple tables', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'age', type: 'number', isNullable: true },
          { name: 'isActive', type: 'boolean', isNullable: false }
        ],
        Post: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false },
          { name: 'content', type: 'string', isNullable: true }
        ],
        Comment: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'text', type: 'string', isNullable: false },
          { name: 'authorId', type: 'uuid', isNullable: false }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'fullName', type: 'string', isNullable: true }, // Renamed from 'name' to 'fullName' (handled as drop + add)
          { name: 'age', type: 'number', isNullable: false }, // Modified isNullable
          { name: 'lastLogin', type: 'date', isNullable: true } // Added
        ],
        Article: [
          // Renamed from 'Post' to 'Article' (handled as drop + create)
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'headline', type: 'string', isNullable: false },
          { name: 'body', type: 'string', isNullable: true },
          { name: 'publishedAt', type: 'date', isNullable: true } // Added
        ],
        Comment: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'text', type: 'string', isNullable: false },
          { name: 'authorId', type: 'uuid', isNullable: false },
          { name: 'likes', type: 'number', isNullable: false } // Added
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'createTable',
        tableName: 'Article',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'headline', type: 'string', isNullable: false },
          { name: 'body', type: 'string', isNullable: true },
          { name: 'publishedAt', type: 'date', isNullable: true }
        ]
      },
      {
        type: 'dropTable',
        tableName: 'Post'
      },
      {
        column: {
          isNullable: true,
          name: 'fullName',
          type: 'string'
        },
        tableName: 'User',
        type: 'addColumn'
      },
      {
        type: 'addColumn',
        tableName: 'User',
        column: { name: 'lastLogin', type: 'date', isNullable: true }
      },
      {
        columnName: 'isActive',
        tableName: 'User',
        type: 'dropColumn'
      },
      {
        type: 'modifyColumn',
        tableName: 'User',
        column: { name: 'age', type: 'number', isNullable: false }
      },
      {
        type: 'addColumn',
        tableName: 'Comment',
        column: { name: 'likes', type: 'number', isNullable: false }
      }
    ];

    expect(plan).toEqual(expectedPlan);
    // Since order may vary, ensure all expected steps are present
    expect(plan).toHaveLength(7);
    expect(plan).toEqual(
      expect.arrayContaining([
        // Create 'Article' table
        expect.objectContaining({
          type: 'createTable',
          tableName: 'Article'
        }),
        // Drop 'Post' table
        expect.objectContaining({
          type: 'dropTable',
          tableName: 'Post'
        }),
        // Add 'fullName' and drop 'name' in 'User'
        expect.objectContaining({
          type: 'addColumn',
          tableName: 'User',
          column: { name: 'fullName', type: 'string', isNullable: true }
        }),
        // Add 'lastLogin' column to 'User'
        expect.objectContaining({
          type: 'addColumn',
          tableName: 'User',
          column: { name: 'lastLogin', type: 'date', isNullable: true }
        }),
        // Modify 'age' column in 'User'
        expect.objectContaining({
          type: 'modifyColumn',
          tableName: 'User',
          column: { name: 'age', type: 'number', isNullable: false }
        }),
        // Add 'likes' column to 'Comment'
        expect.objectContaining({
          type: 'addColumn',
          tableName: 'Comment',
          column: { name: 'likes', type: 'number', isNullable: false }
        })
      ])
    );
  });

  it('should handle tables with no columns in both schemas', () => {
    const schemaA: SchemaInfo = {
      tables: {
        EmptyTableA: []
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        EmptyTableA: []
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    expect(plan).toEqual([]);
  });

  it('should handle tables being renamed by dropping the old and creating the new', () => {
    const schemaA: SchemaInfo = {
      tables: {
        OldTable: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'data', type: 'string', isNullable: true }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        NewTable: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'data', type: 'string', isNullable: true }
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'createTable',
        tableName: 'NewTable',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'data', type: 'string', isNullable: true }
        ]
      },
      {
        type: 'dropTable',
        tableName: 'OldTable'
      }
    ];

    expect(plan).toEqual(expectedPlan);
    expect(plan).toHaveLength(2);
    expect(plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'createTable',
          tableName: 'NewTable'
        }),
        expect.objectContaining({
          type: 'dropTable',
          tableName: 'OldTable'
        })
      ])
    );
  });

  it('should handle columns with changes in multiple properties', () => {
    const schemaA: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'age', type: 'number', isNullable: true }
        ]
      }
    };

    const schemaB: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: true }, // Changed isNullable
          { name: 'age', type: 'string', isNullable: false }, // Changed type and isNullable
          { name: 'lastName', type: 'string', isNullable: true } // Added
        ]
      }
    };

    const plan = compareSchemas(schemaA, schemaB);
    const expectedPlan = [
      {
        type: 'addColumn',
        tableName: 'User',
        column: { name: 'lastName', type: 'string', isNullable: true }
      },
      {
        type: 'modifyColumn',
        tableName: 'User',
        column: { name: 'email', type: 'string', isNullable: true }
      },
      {
        type: 'modifyColumn',
        tableName: 'User',
        column: { name: 'age', type: 'string', isNullable: false }
      }
    ];

    expect(plan).toEqual(expectedPlan);
    expect(plan).toHaveLength(3);
    expect(plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'addColumn',
          tableName: 'User',
          column: { name: 'lastName', type: 'string', isNullable: true }
        }),
        expect.objectContaining({
          type: 'modifyColumn',
          tableName: 'User',
          column: { name: 'email', type: 'string', isNullable: true }
        }),
        expect.objectContaining({
          type: 'modifyColumn',
          tableName: 'User',
          column: { name: 'age', type: 'string', isNullable: false }
        })
      ])
    );
  });
});

describe('applyMigrationPlan', () => {
  let mockDB: DB;
  let createTableMock: Mock;
  let dropTableMock: Mock;
  let tableMock: Mock;
  let consoleWarnMock: MockInstance;

  beforeEach(() => {
    // Reset mocks before each test
    createTableMock = vi.fn().mockResolvedValue(undefined);
    dropTableMock = vi.fn().mockResolvedValue(undefined);
    tableMock = vi.fn().mockResolvedValue(undefined);
    consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockDB = {
      schema: {
        createTable: createTableMock,
        dropTable: dropTableMock,
        table: tableMock
      },
      migrate: vi.fn().mockResolvedValue(undefined)
    };
  });

  afterEach(() => {
    // Restore mocks after each test
    vi.restoreAllMocks();
  });

  it('should create a table with specified columns', async () => {
    const plan: MigrationPlan = [
      {
        type: 'createTable',
        tableName: 'User',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'name', type: 'string', isNullable: true }
        ]
      }
    ];

    await applyMigrationPlan(mockDB, plan);

    expect(createTableMock).toHaveBeenCalledTimes(1);
    expect(createTableMock).toHaveBeenCalledWith('User', expect.any(Function));

    // Simulate the table creation callback
    const createTableCallback = createTableMock.mock.calls[0][1];
    const table = {
      uuid: vi.fn().mockReturnThis(),
      string: vi.fn().mockReturnThis(),
      notNullable: vi.fn().mockReturnThis(),
      nullable: vi.fn().mockReturnThis(),
      primary: vi.fn().mockReturnThis(),
      unique: vi.fn().mockReturnThis()
    };
    createTableCallback(table);

    // Verify column definitions
    expect(table.uuid).toHaveBeenCalledWith('id');
    expect(table.string).toHaveBeenCalledWith('email');
    expect(table.string).toHaveBeenCalledWith('name');

    expect(table.uuid().notNullable).toHaveBeenCalled();
    expect(table.string().notNullable).toHaveBeenCalled();
    expect(table.string().nullable).toHaveBeenCalled();
  });

  it('should drop a table', async () => {
    const plan: MigrationPlan = [
      {
        type: 'dropTable',
        tableName: 'OldTable'
      }
    ];

    await applyMigrationPlan(mockDB, plan);

    expect(dropTableMock).toHaveBeenCalledTimes(1);
    expect(dropTableMock).toHaveBeenCalledWith('OldTable');
  });

  it('should add a column to an existing table', async () => {
    const plan: MigrationPlan = [
      {
        type: 'addColumn',
        tableName: 'User',
        column: { name: 'age', type: 'number', isNullable: true }
      }
    ];

    await applyMigrationPlan(mockDB, plan);

    expect(tableMock).toHaveBeenCalledTimes(1);
    expect(tableMock).toHaveBeenCalledWith('User', expect.any(Function));

    // Simulate the table alteration callback
    const alterTableCallback = tableMock.mock.calls[0][1];
    const table = {
      integer: vi.fn().mockReturnThis(),
      notNullable: vi.fn().mockReturnThis(),
      nullable: vi.fn().mockReturnThis(),
      unique: vi.fn().mockReturnThis()
    };
    alterTableCallback(table);

    // Verify column definitions
    expect(table.integer).toHaveBeenCalledWith('age');
    expect(table.integer().nullable).toHaveBeenCalled();
  });

  it('should drop a column from an existing table', async () => {
    const plan: MigrationPlan = [
      {
        type: 'dropColumn',
        tableName: 'User',
        columnName: 'obsoleteField'
      }
    ];

    await applyMigrationPlan(mockDB, plan);

    expect(tableMock).toHaveBeenCalledTimes(1);
    expect(tableMock).toHaveBeenCalledWith('User', expect.any(Function));

    // Simulate the table alteration callback
    const alterTableCallback = tableMock.mock.calls[0][1];
    const table = {
      dropColumn: vi.fn().mockReturnThis()
    };
    alterTableCallback(table);

    // Verify column drop
    expect(table.dropColumn).toHaveBeenCalledWith('obsoleteField');
  });

  it('should handle multiple migration steps', async () => {
    const plan: MigrationPlan = [
      {
        type: 'createTable',
        tableName: 'Post',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false }
        ]
      },
      {
        type: 'addColumn',
        tableName: 'User',
        column: { name: 'age', type: 'number', isNullable: true }
      },
      {
        type: 'dropTable',
        tableName: 'OldTable'
      }
    ];

    await applyMigrationPlan(mockDB, plan);

    // Verify createTable
    expect(createTableMock).toHaveBeenCalledTimes(1);
    expect(createTableMock).toHaveBeenCalledWith('Post', expect.any(Function));

    const createTableCallback = createTableMock.mock.calls[0][1];
    const createTable = {
      uuid: vi.fn().mockReturnThis(),
      string: vi.fn().mockReturnThis(),
      notNullable: vi.fn().mockReturnThis(),
      primary: vi.fn().mockReturnThis(),
      unique: vi.fn().mockReturnThis()
    };
    createTableCallback(createTable);

    expect(createTable.uuid).toHaveBeenCalledWith('id');
    expect(createTable.string).toHaveBeenCalledWith('title');
    expect(createTable.uuid().notNullable).toHaveBeenCalled();
    expect(createTable.string().notNullable).toHaveBeenCalled();

    // Verify addColumn
    expect(tableMock).toHaveBeenCalledTimes(1);
    expect(tableMock).toHaveBeenCalledWith('User', expect.any(Function));

    const alterTableCallback = tableMock.mock.calls[0][1];
    const alterTable = {
      integer: vi.fn().mockReturnThis(),
      nullable: vi.fn().mockReturnThis(),
      unique: vi.fn().mockReturnThis()
    };
    alterTableCallback(alterTable);

    expect(alterTable.integer).toHaveBeenCalledWith('age');
    expect(alterTable.integer().nullable).toHaveBeenCalled();

    // Verify dropTable
    expect(dropTableMock).toHaveBeenCalledTimes(1);
    expect(dropTableMock).toHaveBeenCalledWith('OldTable');
  });

  it('should handle an empty migration plan gracefully', async () => {
    const plan: MigrationPlan = [];

    await applyMigrationPlan(mockDB, plan);

    expect(createTableMock).not.toHaveBeenCalled();
    expect(dropTableMock).not.toHaveBeenCalled();
    expect(tableMock).not.toHaveBeenCalled();
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it('should warn when modifyColumn step is encountered', async () => {
    const plan: MigrationPlan = [
      {
        type: 'modifyColumn',
        tableName: 'User',
        column: { name: 'email', type: 'string', isNullable: false }
      }
    ];

    await applyMigrationPlan(mockDB, plan);

    expect(createTableMock).not.toHaveBeenCalled();
    expect(dropTableMock).not.toHaveBeenCalled();
    expect(tableMock).toHaveBeenCalledTimes(1);

    expect(consoleWarnMock).toHaveBeenCalledTimes(1);
    expect(consoleWarnMock).toHaveBeenCalledWith(
      'Modify column step for table User and column email is not implemented.'
    );
  });

  it('should throw an error for unknown migration step types', async () => {
    const plan: any[] = [
      {
        type: 'unknownStep',
        tableName: 'User',
        columnName: 'field'
      }
    ];

    await expect(applyMigrationPlan(mockDB, plan)).rejects.toThrow(
      'Unknown migration step type: unknownStep'
    );

    expect(createTableMock).not.toHaveBeenCalled();
    expect(dropTableMock).not.toHaveBeenCalled();
    expect(tableMock).not.toHaveBeenCalled();
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });
});

// migrationPlanToKnexMigrations.test.ts
import type { Knex } from 'knex';

describe('migrationPlanToKnexMigration', () => {
  let knexMock: Knex;
  let createTableMock: Mock;
  let dropTableMock: Mock;
  let tableMock: Mock;
  let consoleWarnMock: MockInstance;

  beforeEach(() => {
    // Initialize mocks before each test
    createTableMock = vi.fn().mockResolvedValue(undefined);
    dropTableMock = vi.fn().mockResolvedValue(undefined);
    tableMock = vi.fn().mockResolvedValue(undefined);
    consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock Knex instance
    knexMock = {
      schema: {
        createTable: createTableMock,
        dropTable: dropTableMock,
        table: tableMock
      }
      // Other Knex methods can be mocked as needed
    } as any as Knex;
  });

  afterEach(() => {
    // Restore mocks after each test
    vi.restoreAllMocks();
  });

  it('should create tables with correct columns', async () => {
    const plan: MigrationPlan = [
      {
        type: 'createTable',
        tableName: 'User',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, isPrimaryKey: true },
          { name: 'email', type: 'string', isNullable: false, isUnique: true },
          { name: 'name', type: 'string', isNullable: true }
        ]
      }
    ];

    const migration = migrationPlanToKnexMigration(plan);
    await migration.up(knexMock);

    expect(createTableMock).toHaveBeenCalledTimes(1);
    expect(createTableMock).toHaveBeenCalledWith('User', expect.any(Function));

    // Simulate the table creation callback
    const createTableCallback = createTableMock.mock.calls[0][1];
    const table = {
      uuid: vi.fn().mockReturnThis(),
      string: vi.fn().mockReturnThis(),
      notNullable: vi.fn().mockReturnThis(),
      nullable: vi.fn().mockReturnThis(),
      primary: vi.fn().mockReturnThis(),
      unique: vi.fn().mockReturnThis()
    };

    createTableCallback(table);

    // Verify column definitions
    expect(table.uuid).toHaveBeenCalledWith('id');
    expect(table.string).toHaveBeenCalledWith('email');
    expect(table.string).toHaveBeenCalledWith('name');

    expect(table.uuid().notNullable).toHaveBeenCalled();
    expect(table.string().notNullable).toHaveBeenCalled();
    expect(table.string().unique).toHaveBeenCalled();
    expect(table.string().nullable).toHaveBeenCalled();
  });

  it('should drop tables correctly', async () => {
    const plan: MigrationPlan = [
      {
        type: 'dropTable',
        tableName: 'ObsoleteTable'
      }
    ];

    const migration = migrationPlanToKnexMigration(plan);
    await migration.up(knexMock);

    expect(dropTableMock).toHaveBeenCalledTimes(1);
    expect(dropTableMock).toHaveBeenCalledWith('ObsoleteTable');
  });

  it('should add columns correctly', async () => {
    const plan: MigrationPlan = [
      {
        type: 'addColumn',
        tableName: 'User',
        column: { name: 'age', type: 'number', isNullable: true }
      }
    ];

    const migration = migrationPlanToKnexMigration(plan);
    await migration.up(knexMock);

    expect(tableMock).toHaveBeenCalledTimes(1);
    expect(tableMock).toHaveBeenCalledWith('User', expect.any(Function));

    // Simulate the table alteration callback
    const alterTableCallback = tableMock.mock.calls[0][1];
    const table = {
      integer: vi.fn().mockReturnThis(),
      nullable: vi.fn().mockReturnThis()
    };

    alterTableCallback(table);

    // Verify column definitions
    expect(table.integer).toHaveBeenCalledWith('age');
    expect(table.integer().nullable).toHaveBeenCalled();
  });

  it('should drop columns correctly', async () => {
    const plan: MigrationPlan = [
      {
        type: 'dropColumn',
        tableName: 'User',
        columnName: 'obsoleteField'
      }
    ];

    const migration = migrationPlanToKnexMigration(plan);
    await migration.up(knexMock);

    expect(tableMock).toHaveBeenCalledTimes(1);
    expect(tableMock).toHaveBeenCalledWith('User', expect.any(Function));

    // Simulate the table alteration callback
    const alterTableCallback = tableMock.mock.calls[0][1];
    const table = {
      dropColumn: vi.fn().mockReturnThis()
    };

    alterTableCallback(table);

    // Verify column drop
    expect(table.dropColumn).toHaveBeenCalledWith('obsoleteField');
  });

  it('should handle multiple migration steps', async () => {
    const plan: MigrationPlan = [
      {
        type: 'createTable',
        tableName: 'Post',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, isPrimaryKey: true },
          { name: 'title', type: 'string', isNullable: false }
        ]
      },
      {
        type: 'addColumn',
        tableName: 'User',
        column: { name: 'age', type: 'number', isNullable: true }
      },
      {
        type: 'dropTable',
        tableName: 'ObsoleteTable'
      }
    ];

    const migration = migrationPlanToKnexMigration(plan);
    await migration.up(knexMock);

    // Verify createTable
    expect(createTableMock).toHaveBeenCalledTimes(1);
    expect(createTableMock).toHaveBeenCalledWith('Post', expect.any(Function));

    const createTableCallback = createTableMock.mock.calls[0][1];
    const createTable = {
      uuid: vi.fn().mockReturnThis(),
      string: vi.fn().mockReturnThis(),
      notNullable: vi.fn().mockReturnThis(),
      primary: vi.fn().mockReturnThis(),
      unique: vi.fn().mockReturnThis()
    };
    createTableCallback(createTable);

    expect(createTable.uuid).toHaveBeenCalledWith('id');
    expect(createTable.string).toHaveBeenCalledWith('title');
    expect(createTable.uuid().notNullable).toHaveBeenCalled();
    expect(createTable.string().notNullable).toHaveBeenCalled();

    // Verify addColumn
    expect(tableMock).toHaveBeenCalledTimes(1);
    expect(tableMock).toHaveBeenCalledWith('User', expect.any(Function));

    const alterTableCallback = tableMock.mock.calls[0][1];
    const alterTable = {
      integer: vi.fn().mockReturnThis(),
      nullable: vi.fn().mockReturnThis(),
      unique: vi.fn().mockReturnThis()
    };
    alterTableCallback(alterTable);

    expect(alterTable.integer).toHaveBeenCalledWith('age');
    expect(alterTable.integer().nullable).toHaveBeenCalled();

    // Verify dropTable
    expect(dropTableMock).toHaveBeenCalledTimes(1);
    expect(dropTableMock).toHaveBeenCalledWith('ObsoleteTable');
  });

  it('should handle empty migration plan without errors', async () => {
    const plan: MigrationPlan = [];

    const migration = migrationPlanToKnexMigration(plan);
    await migration.up(knexMock);

    // Ensure no schema methods are called
    expect(createTableMock).not.toHaveBeenCalled();
    expect(dropTableMock).not.toHaveBeenCalled();
    expect(tableMock).not.toHaveBeenCalled();

    // No warnings should be logged
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it('should warn when encountering modifyColumn step', async () => {
    const plan: MigrationPlan = [
      {
        type: 'modifyColumn',
        tableName: 'User',
        column: { name: 'email', type: 'string', isNullable: false }
      }
    ];

    const migration = migrationPlanToKnexMigration(plan);
    await migration.up(knexMock);

    // Ensure no schema methods are called
    expect(createTableMock).not.toHaveBeenCalled();
    expect(dropTableMock).not.toHaveBeenCalled();
    expect(tableMock).toHaveBeenCalled();

    // Verify warning
    expect(consoleWarnMock).toHaveBeenCalledTimes(1);
    expect(consoleWarnMock).toHaveBeenCalledWith(
      'Modify column step for table "User" and column "email" is not implemented.'
    );
  });

  it('should throw an error for unknown migration step types', async () => {
    const plan: any[] = [
      {
        type: 'unknownStep',
        tableName: 'User',
        columnName: 'field'
      }
    ];

    const migration = migrationPlanToKnexMigration(plan);
    await expect(migration.up(knexMock)).rejects.toThrow(
      'Unknown migration step type: unknownStep'
    );

    // Ensure no schema methods are called
    expect(createTableMock).not.toHaveBeenCalled();
    expect(dropTableMock).not.toHaveBeenCalled();
    expect(tableMock).not.toHaveBeenCalled();

    // No warnings should be logged
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });
});

/**
 * MockKnex simulates Knex's schema interface.
 * It maintains an internal representation of the database schema.
 */
// class MockKnex implements Knex {
// class MockKnex implements Partial<Knex> {
class MockKnex {
  // Internal schema representation
  public internalSchema: SchemaInfo;

  constructor(initialSchema: SchemaInfo = { tables: {} }) {
    this.internalSchema = JSON.parse(JSON.stringify(initialSchema)); // Deep copy to prevent mutation
  }
  //   public constructor(connectionConfig?: Knex.Config | undefined) {
  //     // No-op
  //   }

  // Mock the schema property
  public schema = {
    createTable: async (tableName: string, callback: (table: any) => void) => {
      if (this.internalSchema.tables[tableName]) {
        throw new Error(`Table "${tableName}" already exists.`);
      }
      const tableBuilder = new MockTableBuilder();
      callback(tableBuilder);
      this.internalSchema.tables[tableName] = tableBuilder.columns;
    },
    dropTable: async (tableName: string) => {
      if (!this.internalSchema.tables[tableName]) {
        throw new Error(`Table "${tableName}" does not exist.`);
      }
      delete this.internalSchema.tables[tableName];
    },
    table: async (tableName: string, callback: (table: any) => void) => {
      if (!this.internalSchema.tables[tableName]) {
        throw new Error(`Table "${tableName}" does not exist.`);
      }
      const tableBuilder = new MockTableAlterBuilder(this.internalSchema.tables[tableName]);
      callback(tableBuilder);
      this.internalSchema.tables[tableName] = tableBuilder.columns;
    }
  };

  // Mock the raw method for executing raw SQL
  public async raw(sql: string, _bindings?: any[]): Promise<any> {
    // Simple parser for specific ALTER TABLE statements used in modifyColumn
    const alterTypeRegex = /ALTER TABLE\s+"(\w+)"\s+ALTER COLUMN\s+"(\w+)"\s+TYPE\s+(\w+);/i;
    const alterNullableRegex =
      /ALTER TABLE\s+"(\w+)"\s+ALTER COLUMN\s+"(\w+)"\s+(SET NOT NULL|DROP NOT NULL);/i;
    const addPrimaryKeyRegex = /ALTER TABLE\s+"(\w+)"\s+ADD PRIMARY KEY\s+\("(\w+)"\);/i;
    const addUniqueRegex = /ALTER TABLE\s+"(\w+)"\s+ADD UNIQUE\s+\("(\w+)"\);/i;

    let match = alterTypeRegex.exec(sql);
    if (match) {
      const [, tableName, columnName, newType] = match;
      const table = this.internalSchema.tables[tableName];
      if (!table) throw new Error(`Table "${tableName}" does not exist.`);
      const column = table.find((col) => col.name === columnName);
      if (!column)
        throw new Error(`Column "${columnName}" does not exist in table "${tableName}".`);
      column.type = newType.toLowerCase(); // Normalize type
      return;
    }

    match = alterNullableRegex.exec(sql);
    if (match) {
      const [, tableName, columnName, action] = match;
      const table = this.internalSchema.tables[tableName];
      if (!table) throw new Error(`Table "${tableName}" does not exist.`);
      const column = table.find((col) => col.name === columnName);
      if (!column)
        throw new Error(`Column "${columnName}" does not exist in table "${tableName}".`);
      column.isNullable = action !== 'DROP NOT NULL';
      return;
    }

    match = addPrimaryKeyRegex.exec(sql);
    if (match) {
      const [, tableName, columnName] = match;
      const table = this.internalSchema.tables[tableName];
      if (!table) throw new Error(`Table "${tableName}" does not exist.`);
      const column = table.find((col) => col.name === columnName);
      if (!column)
        throw new Error(`Column "${columnName}" does not exist in table "${tableName}".`);
      column.isPrimaryKey = true;
      return;
    }

    match = addUniqueRegex.exec(sql);
    if (match) {
      const [, tableName, columnName] = match;
      const table = this.internalSchema.tables[tableName];
      if (!table) throw new Error(`Table "${tableName}" does not exist.`);
      const column = table.find((col) => col.name === columnName);
      if (!column)
        throw new Error(`Column "${columnName}" does not exist in table "${tableName}".`);
      column.isUnique = true;
      return;
    }

    throw new Error(`Unsupported raw SQL statement: ${sql}`);
  }

  // Implement other Knex methods as no-ops or throw errors
  // For the purposes of this test, only the schema and raw methods are needed
  // ... (other methods can be left unimplemented or throw errors)

  // Required by the Knex interface but not used in this mock
  public client: any;
  public config: any;
  public rawBindings: any;
  public version: any;
  public transactionProvider: any;
  public runner: any;
  public initialize() {
    /* method 'initialize' is empty */
  }
  public acquireRawConnection() {
    throw new Error('Not implemented');
  }
  public acquireConnection() {
    throw new Error('Not implemented');
  }
  public releaseConnection() {
    throw new Error('Not implemented');
  }
  //   public destroy() {
  //     throw new Error('Not implemented');
  //   }
  //   public select() {
  //     throw new Error('Not implemented');
  //   }
  //   public insert() {
  //     throw new Error('Not implemented');
  //   }
  //   public update() {
  //     throw new Error('Not implemented');
  //   }
  //   public del() {
  //     throw new Error('Not implemented');
  //   }
  //   public where() {
  //     throw new Error('Not implemented');
  //   }
  //   public join() {
  //     throw new Error('Not implemented');
  //   }
  //   public orderBy() {
  //     throw new Error('Not implemented');
  //   }
  //   public count() {
  //     throw new Error('Not implemented');
  //   }
  // ... other methods
}

/**
 * MockTableBuilder simulates Knex's table builder for createTable.
 */
class MockTableBuilder {
  public columns: ColumnDefinition[] = [];

  public string(name: string): this {
    this.columns.push({ name, type: 'string', isNullable: true });
    return this;
  }

  public integer(name: string): this {
    this.columns.push({ name, type: 'number', isNullable: true });
    return this;
  }

  public boolean(name: string): this {
    this.columns.push({ name, type: 'boolean', isNullable: true });
    return this;
  }

  public date(name: string): this {
    this.columns.push({ name, type: 'date', isNullable: true });
    return this;
  }

  public uuid(name: string): this {
    this.columns.push({ name, type: 'uuid', isNullable: true });
    return this;
  }

  public notNullable(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.isNullable = false;
    }
    return this;
  }

  public nullable(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.isNullable = true;
    }
    return this;
  }

  public primary(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.isPrimaryKey = true;
    }
    return this;
  }

  public unique(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.isUnique = true;
    }
    return this;
  }
}

/**
 * MockTableAlterBuilder simulates Knex's table builder for alterTable.
 */
class MockTableAlterBuilder {
  public columns: ColumnDefinition[];

  constructor(existingColumns: ColumnDefinition[]) {
    this.columns = JSON.parse(JSON.stringify(existingColumns)); // Deep copy
  }

  public string(name: string): this {
    this.columns.push({ name, type: 'string', isNullable: true });
    return this;
  }

  public integer(name: string): this {
    this.columns.push({ name, type: 'number', isNullable: true });
    return this;
  }

  public boolean(name: string): this {
    this.columns.push({ name, type: 'boolean', isNullable: true });
    return this;
  }

  public date(name: string): this {
    this.columns.push({ name, type: 'date', isNullable: true });
    return this;
  }

  public uuid(name: string): this {
    this.columns.push({ name, type: 'uuid', isNullable: true });
    return this;
  }

  public notNullable(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.isNullable = false;
    }
    return this;
  }

  public nullable(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.isNullable = true;
    }
    return this;
  }

  public primary(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.isPrimaryKey = true;
    }
    return this;
  }

  public unique(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.isUnique = true;
    }
    return this;
  }

  public dropColumn(name: string): this {
    const index = this.columns.findIndex((col) => col.name === name);
    if (index !== -1) {
      this.columns.splice(index, 1);
    }
    return this;
  }
}

describe('generateKnexMigrations', () => {
  let mockKnex: MockKnex;

  beforeEach(() => {
    // Initialize mock Knex with empty schema
    mockKnex = new MockKnex({ tables: {} });
  });

  afterEach(() => {
    // Cleanup if necessary
  });

  it('should generate and apply migrations for multiple schema versions correctly', async () => {
    // Define Zod schemas for two versions
    const dbSchemaV1: Schema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        password: z.string()
      })
    };

    const dbSchemaV2: Schema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        passwordHash: z.string(),
        name: z.string().optional()
      }),
      Post: z.object({
        id: z.string().uuid(),
        title: z.string(),
        content: z.string(),
        userId: z.string().uuid()
      })
    };

    // Define dbSchemaHistory with planHooks (no modifications in this example)
    const dbSchemaHistory: DbSchemaHistory = {
      v1: {
        schema: dbSchemaV1,
        planHook: (plan: MigrationPlan) => plan
      },
      v2: {
        schema: dbSchemaV2,
        planHook: (plan: MigrationPlan) => plan
      }
    };

    // Generate migrations
    const migrations = generateKnexMigrations(dbSchemaHistory);

    // Apply each migration's up() function to the mock Knex
    for (const [_version, migration] of Object.entries(migrations)) {
      await migration.up(mockKnex as any as Knex); // Type assertion to match Knex interface
    }

    // Define the expected final schema
    const expectedSchema: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'passwordHash', type: 'string', isNullable: false },
          { name: 'name', type: 'string', isNullable: true }
        ],
        Post: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'string', isNullable: false },
          { name: 'content', type: 'string', isNullable: false },
          { name: 'userId', type: 'uuid', isNullable: false }
        ]
      }
    };

    // Compare the mock Knex's internal schema to the expected schema
    expect(mockKnex.internalSchema).toEqual(expectedSchema);
  });

  it('should handle the very first version by comparing with an empty schema', async () => {
    // Define Zod schema for the first version
    const dbSchemaV1: Schema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        password: z.string()
      })
    };

    // Define dbSchemaHistory with only the first version
    const dbSchemaHistory: DbSchemaHistory = {
      v1: {
        schema: dbSchemaV1,
        planHook: (plan: MigrationPlan) => plan
      }
    };

    // Generate migrations
    const migrations = generateKnexMigrations(dbSchemaHistory);

    // Apply each migration's up() function to the mock Knex
    for (const [_version, migration] of Object.entries(migrations)) {
      await migration.up(mockKnex as any as Knex); // Type assertion to match Knex interface
    }

    // Define the expected final schema
    const expectedSchema: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'password', type: 'string', isNullable: false }
        ]
      }
    };

    // Compare the mock Knex's internal schema to the expected schema
    expect(mockKnex.internalSchema).toEqual(expectedSchema);
  });

  it('should apply planHook modifications to the migration plan', async () => {
    // Define Zod schemas
    const dbSchemaV1: Schema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email()
      })
    };

    const dbSchemaV2: Schema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        name: z.string().optional()
      })
    };

    // Define a planHook that removes the 'addColumn' step for 'name'
    const planHook = (plan: MigrationPlan): MigrationPlan =>
      plan.filter((step) => !(step.type === 'addColumn' && step.column.name === 'name'));

    const dbSchemaHistory: DbSchemaHistory = {
      v1: {
        schema: dbSchemaV1,
        planHook: (plan: MigrationPlan) => plan
      },
      v2: {
        schema: dbSchemaV2,
        planHook
      }
    };

    // Generate migrations
    const migrations = generateKnexMigrations(dbSchemaHistory);

    // Apply each migration's up() function to the mock Knex
    for (const [_version, migration] of Object.entries(migrations)) {
      await migration.up(mockKnex as any as Knex); // Type assertion to match Knex interface
    }

    // Define the expected final schema without the 'name' column due to planHook filtering
    const expectedSchema: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false }
        ]
      }
    };

    // Compare the mock Knex's internal schema to the expected schema
    expect(mockKnex.internalSchema).toEqual(expectedSchema);
  });

  it('should handle dropping a table correctly', async () => {
    // Define Zod schemas for two versions
    const dbSchemaV1: Schema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        password: z.string()
      }),
      Post: z.object({
        id: z.string().uuid(),
        title: z.string(),
        content: z.string(),
        userId: z.string().uuid()
      })
    };

    const dbSchemaV2: Schema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        passwordHash: z.string(),
        name: z.string().optional()
      })
      // Post table is dropped in v2
    };

    const dbSchemaHistory: DbSchemaHistory = {
      v1: {
        schema: dbSchemaV1,
        planHook: (plan: MigrationPlan) => plan
      },
      v2: {
        schema: dbSchemaV2,
        planHook: (plan: MigrationPlan) => plan
      }
    };

    // Generate migrations
    const migrations = generateKnexMigrations(dbSchemaHistory);

    // Apply each migration's up() function to the mock Knex
    for (const [_version, migration] of Object.entries(migrations)) {
      await migration.up(mockKnex as any as Knex); // Type assertion to match Knex interface
    }

    // Define the expected final schema with Post table dropped
    const expectedSchema: SchemaInfo = {
      tables: {
        User: [
          { name: 'id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'string', isNullable: false },
          { name: 'passwordHash', type: 'string', isNullable: false },
          { name: 'name', type: 'string', isNullable: true }
        ]
      }
    };

    // Compare the mock Knex's internal schema to the expected schema
    expect(mockKnex.internalSchema).toEqual(expectedSchema);
  });

  it('should throw an error when attempting to create an existing table', async () => {
    // Define Zod schema for first version
    const dbSchemaV1: Schema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email()
      })
    };

    // Define dbSchemaHistory with the same table in two versions
    const dbSchemaHistory: DbSchemaHistory = {
      v1: {
        schema: dbSchemaV1,
        planHook: (plan: MigrationPlan) => plan
      },
      v2: {
        schema: dbSchemaV1, // Same schema, no changes
        planHook: (plan: MigrationPlan) => [
          ...plan,
          {
            type: 'createTable',
            tableName: 'User',
            columns: [
              { name: 'id', type: 'uuid', isNullable: false },
              { name: 'email', type: 'string', isNullable: false }
            ]
          }
        ]
      }
    };

    // Generate migrations
    const migrations = generateKnexMigrations(dbSchemaHistory);
    const migrationsArray = Object.entries(migrations);

    // Apply first migration (should create User table)
    await migrationsArray[0][1].up(mockKnex as any as Knex);

    // Attempt to apply second migration (should attempt to create User table again and throw an error)
    await expect(migrationsArray[1][1].up(mockKnex as any as Knex)).rejects.toThrow(
      'Table "User" already exists.'
    );
  });

  it('should throw an error when attempting to drop a non-existent table', async () => {
    // Define Zod schemas for two versions
    const dbSchemaV1: Schema = {
      User: z.object({
        id: z.string().uuid(),
        email: z.string().email()
      })
    };

    const dbSchemaV2: Schema = {
      // No tables
    };

    const dbSchemaHistory: DbSchemaHistory = {
      v1: {
        schema: dbSchemaV1,
        planHook: (plan: MigrationPlan) => plan
      },
      v2: {
        schema: dbSchemaV2,
        planHook: (plan: MigrationPlan) => plan
      }
    };

    // Generate migrations
    const migrations = generateKnexMigrations(dbSchemaHistory);
    const migrationsArray = Object.entries(migrations);

    // Apply first migration (should create User table)
    await migrationsArray[0][1].up(mockKnex as any as Knex);

    // Apply second migration (should drop User table)
    await migrationsArray[1][1].up(mockKnex as any as Knex);

    // Attempt to drop User table again, which should throw an error
    const duplicateDropMigration = migrationPlanToKnexMigration([
      {
        type: 'dropTable',
        tableName: 'User'
      }
    ]);

    await expect(duplicateDropMigration.up(mockKnex as any as Knex)).rejects.toThrow(
      'Table "User" does not exist.'
    );
  });
});
