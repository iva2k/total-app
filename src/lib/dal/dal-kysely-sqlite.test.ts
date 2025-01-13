import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KyselySqliteDatabase } from './dal-kysely-sqlite';
import type { Schema } from '$lib/dal/dal-types';
import { type DatabaseSchemaType, UserSchema, type User } from '$lib/db-schema';
import { withoutTimestamps } from '$lib/dal/dalUtils';

// Test schema
const mockSchema: Schema = {
  User: UserSchema
};

// Utility function to set up an in-memory SQLite database using Kysely
const createInMemoryDb = async () => {
  const dbFilePath = ':memory:';
  const db = new KyselySqliteDatabase(dbFilePath, mockSchema);
  await db.initialize(); // Initialize the KyselySqliteDatabase
  return db;
};

describe('KyselySqliteDatabase with :memory:', () => {
  let db: KyselySqliteDatabase<DatabaseSchemaType>;
  const newUser: User = {
    id: 1,
    name: 'Test User',
    email: 'testuser@example.com',
    emailVerified: null,
    image: null,
    passwordHash: ''
  };

  beforeEach(async () => {
    db = await createInMemoryDb(); // Create an in-memory Kysely database
  });

  afterEach(async () => {
    await db?.close();
  });

  it('should create a database with an in-memory database', async () => {
    expect(db).toBeTruthy();
  });

  it('should create a new user in the database', async () => {
    await db.create('User', newUser);
    const foundUser = await db.findById('User', '1');
    expect(foundUser).toBeTruthy();
    if (foundUser) expect(withoutTimestamps(foundUser)).toEqual(withoutTimestamps(newUser));
  });

  it('should update an existing user in the database', async () => {
    await db.create('User', newUser);
    const foundUser = await db.findById<User>('User', '1');
    expect(foundUser).toBeTruthy();
    if (foundUser) expect(withoutTimestamps(foundUser)).toEqual(withoutTimestamps(newUser));
    const updatedUser = { ...newUser, name: 'Updated User' };
    await db.update('User', updatedUser);
    const foundUser2 = await db.findById<User>('User', '1');
    expect(foundUser2?.name).toEqual('Updated User');
  });

  it('transactions should update an existing user in the database', async () => {
    await db.transaction().then(async (txn) => {
      await txn.create('User', newUser);
      await txn.commit();
    });
    const foundUser = await db.findById<User>('User', '1');
    expect(foundUser).toBeTruthy();
    if (foundUser) expect(withoutTimestamps(foundUser)).toEqual(withoutTimestamps(newUser));

    await db.transaction().then(async (txn) => {
      const updatedUser = { ...newUser, name: 'Updated User' };
      await txn.update('User', updatedUser);
      await txn.commit();
    });
    const foundUser2 = await db.findById<User>('User', '1');
    expect(foundUser2?.name).toEqual('Updated User');
  });

  it('rollback should cancel update of an existing user in the database', async () => {
    await db.transaction().then(async (txn) => {
      await txn.create('User', newUser);
      await txn.commit();
    });
    const foundUser = await db.findById<User>('User', newUser.id);
    expect(foundUser).toBeTruthy();
    if (foundUser) expect(withoutTimestamps(foundUser)).toEqual(withoutTimestamps(newUser));

    await db.transaction().then(async (txn) => {
      const updatedUser = { ...newUser, name: 'Updated User' };
      await txn.update('User', updatedUser);
      await txn.rollback();
    });
    const foundUser2 = await db.findById<User>('User', newUser.id);
    if (foundUser2) expect(withoutTimestamps(foundUser2)).toEqual(withoutTimestamps(newUser));
  });

  it('should delete a user from the database', async () => {
    const user = await db.create('User', newUser);
    const foundUser = await db.findById('User', user.id);
    expect(foundUser).not.toBeNull();
    await db.delete('User', user.id);
    const foundUser2 = (await db.findById('User', user.id)) ?? null;
    expect(foundUser2).toBeNull();
  });

  it('should list all users from the database', async () => {
    const user1 = newUser;
    const user2: User = {
      id: 2,
      name: 'Test User 2',
      email: 'user2@example.com',
      emailVerified: null,
      image: null,
      passwordHash: ''
    };

    await db.create('User', user1);
    await db.create('User', user2);

    const users = await db.findAll('User');
    const usersM = users.map((u) => withoutTimestamps(u));
    expect(users).toHaveLength(2);
    expect(usersM).toContainEqual(withoutTimestamps(user1));
    expect(usersM).toContainEqual(withoutTimestamps(user2));
  });

  it('should find a user by email using findOne', async () => {
    await db.create('User', newUser);
    const foundUser = await db.findOne<User>('User', { email: newUser.email });
    expect(foundUser).toBeTruthy();
    if (foundUser) expect(withoutTimestamps(foundUser)).toEqual(withoutTimestamps(newUser));
  });

  it('should find a user by name using findOne', async () => {
    await db.create('User', newUser);
    const foundUser = await db.findOne<User>('User', { name: newUser.name });
    expect(foundUser).toBeTruthy();
    if (foundUser) expect(withoutTimestamps(foundUser)).toEqual(withoutTimestamps(newUser));
  });

  it('should return null when findOne finds no matching user', async () => {
    const foundUser = await db.findOne<User>('User', { email: 'nonexistent@example.com' });
    expect(foundUser).toBeNull();
  });

  it('should find a user by multiple properties using findOne', async () => {
    await db.create('User', newUser);
    const foundUser = await db.findOne<User>('User', { name: newUser.name, email: newUser.email });
    expect(foundUser).toBeTruthy();
    if (foundUser) expect(withoutTimestamps(foundUser)).toEqual(withoutTimestamps(newUser));
  });

  it("should not find a user when one property doesn't match using findOne", async () => {
    await db.create('User', newUser);
    const foundUser = await db.findOne<User>('User', {
      name: newUser.name,
      email: 'wrong@example.com'
    });
    expect(foundUser).toBeNull();
  });

  it('should find the first matching user when multiple users match the criteria', async () => {
    const user1 = { ...newUser, id: '1', email: 'user1@example.com' };
    const user2 = { ...newUser, id: '2', email: 'user2@example.com' };
    await db.create('User', user1);
    await db.create('User', user2);

    const foundUser = await db.findOne<User>('User', { name: newUser.name });
    expect(foundUser).toBeTruthy();
    if (foundUser) expect(foundUser.id).toEqual(1); // Assuming findOne returns the first match
  });
});
