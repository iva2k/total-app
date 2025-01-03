import { v4 as uuidv4 } from 'uuid';

import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken as AdapterVerificationToken
} from '@auth/core/adapters';

import { getDatabase } from '$lib/dal/dal';
import type { IDatabase } from '$lib/dal/dal-types';
import type { Account, Session, User, VerificationToken } from '$lib/db-schema';

export type AdapterAccountWithId = AdapterAccount & { id?: string };
export type AdapterSessionWithId = AdapterSession & { id?: string };
export type VerificationTokenWithId = AdapterVerificationToken & { id?: string };

export function createAuthAdapter<TDatabase>(): Adapter {
  let db: IDatabase<TDatabase> | null = null;

  async function initialize() {
    if (!db) {
      db = await getDatabase<TDatabase>();
    }
  }

  return {
    // Called to retrieve a user by their ID
    async getUser(id: string): Promise<AdapterUser | null> {
      await initialize();
      if (!db) return null;
      return db.findById<AdapterUser>('User', id);
    },

    // Called to retrieve a user by their email
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      await initialize();
      if (!db) return null;
      const users = await db.findAll<AdapterUser>('User');
      return users.find((user) => user.email === email) || null;
    },

    // Called to retrieve a user by their account provider and providerAccountId
    async getUserByAccount({
      provider,
      providerAccountId
    }: {
      provider: string;
      providerAccountId: string;
    }): Promise<AdapterUser | null> {
      await initialize();
      if (!db) return null;
      const accounts = await db.findAll<AdapterAccountWithId>('Account');
      const account = accounts.find(
        (acc) => acc.provider === provider && acc.providerAccountId === providerAccountId
      );
      if (account) {
        return db.findById<AdapterUser>('User', account.userId);
      }
      return null;
    },

    // Called to create a new user
    async createUser(user: AdapterUser): Promise<AdapterUser> {
      await initialize();
      if (!db) throw new Error('Database not initialized');
      (user as User).passwordHash = '';
      return db.create<AdapterUser>('User', user);
    },

    // Called to update a user's information
    async updateUser(user: AdapterUser): Promise<AdapterUser> {
      await initialize();
      if (!db) throw new Error('Database not initialized');
      return db.update<AdapterUser>('User', user);
    },

    // Called to delete a user by ID
    async deleteUser(id: string): Promise<void> {
      await initialize();
      if (!db) throw new Error('Database not initialized');
      await db.delete('User', id);
    },

    // Called to create a new session
    async createSession(session: AdapterSession): Promise<AdapterSession> {
      await initialize();
      if (!db) throw new Error('Database not initialized');
      (session as Session).id = uuidv4();
      return db.create<AdapterSessionWithId>('Session', session);
    },

    // Called to retrieve a session by its session token
    async getSessionAndUser(
      sessionToken: string
    ): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      await initialize();
      if (!db) return null;
      const sessions = await db.findAll<AdapterSessionWithId>('Session'); // TODO: (when needed) Add SessionSchema to db-schema.ts
      const session = sessions.find((s) => s.sessionToken === sessionToken);
      if (session) {
        const user = await db.findById<AdapterUser>('User', session.userId);
        if (user) {
          return { session, user };
        }
      }
      return null;
    },

    // Called to update a session
    async updateSession(session: AdapterSession): Promise<AdapterSession> {
      await initialize();
      if (!db) throw new Error('Database not initialized');
      return db.update<AdapterSessionWithId>('Session', session);
    },

    // Called to delete a session by session token
    async deleteSession(sessionToken: string): Promise<void> {
      await initialize();
      if (!db) throw new Error('Database not initialized');
      const sessions = await db.findAll<AdapterSessionWithId>('Session');
      const session = sessions.find((s) => s.sessionToken === sessionToken);
      if (session?.id) {
        await db.delete('Session', session.id);
      }
    },

    // Called to link a user to an OAuth account
    async linkAccount(account: AdapterAccount): Promise<void> {
      await initialize();
      if (!db) throw new Error('Database not initialized');
      (account as Account).id = uuidv4();
      await db.create<AdapterAccountWithId>('Account', account);
    },

    // Called to unlink a user from an OAuth account
    async unlinkAccount({
      provider,
      providerAccountId
    }: {
      provider: string;
      providerAccountId: string;
    }): Promise<void> {
      await initialize();
      if (!db) throw new Error('Database not initialized');
      const accounts = await db.findAll<AdapterAccountWithId>('Account');
      const account = accounts.find(
        (acc) => acc.provider === provider && acc.providerAccountId === providerAccountId
      );
      if (account?.id) {
        await db.delete('Account', account.id);
      }
    },

    // Method to create a verification token for passwordless or email verification flows
    async createVerificationToken(
      token: AdapterVerificationToken
    ): Promise<AdapterVerificationToken> {
      await initialize();
      if (!db) throw new Error('Database not initialized');
      (token as VerificationToken).id = uuidv4();
      return db.create<VerificationTokenWithId>('VerificationToken', token);
    },

    // Method to use (consume) a verification token, deleting it after use
    async useVerificationToken({
      identifier,
      token
    }: {
      identifier: string;
      token: string;
    }): Promise<AdapterVerificationToken | null> {
      await initialize();
      if (!db) return null;
      const tokens = await db.findAll<VerificationTokenWithId>('VerificationToken');
      const verificationToken = tokens.find(
        (t) => t.identifier === identifier && t.token === token
      );

      if (verificationToken?.id) {
        // Delete the token after it's been used
        await db.delete('VerificationToken', verificationToken.id);
        return verificationToken;
      }

      return null;
    }
  };
}
