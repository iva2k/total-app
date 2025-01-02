import { z } from 'zod';

import type {
  // DbSchemaHistory,
  DalConfig,
  IDatabase,
  MigrationPlan,
  Schema
} from '$lib/dal/dal-types';

// Database configuration (SQLite, PostgreSQL, etc.)
export const dbConfig: DalConfig = {
  implementation: 'default', // 'postgres', 'mysql', etc., as you expand support
  dbFilePath: 'database.sqlite'
};

export const UserSchemaV1 = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  name: z.string().optional()
});

export const UserSchemaV1_a = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  name: z.string().optional(),
  oauthProviders: z
    .array(
      z.object({
        provider: z.string(),
        providerId: z.string()
      })
    )
    .optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.date().optional(), // Timestamp when the email was verified
  image: z.string().url().optional(), // URL to user's profile image, optional
  passwordHash: z.string(),
  name: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const AccountSchema = z.object({
  id: z.string().uuid(),
  // userId: z.string().uuid(), // Foreign key to User.id
  userId: z.string().uuid().optional(), // Foreign key to User.id // TODO: (now) Make not optional
  provider: z.string(), // OAuth provider (e.g., 'github', 'google')
  providerAccountId: z.string(), // Provider's unique ID for the account
  refresh_token: z.string().optional(), // OAuth refresh token
  access_token: z.string().optional(), // OAuth access token
  expires_at: z.number().optional(), // OAuth token expiration time (UNIX timestamp)
  // ? (found in TokenEndpointResponse) expires_in: z.number().optional(), // OAuth token expiration time (UNIX timestamp)
  token_type: z.string().optional(), // Type of token (e.g., 'bearer')
  type: z.string().optional(), // Type of provider (e.g., 'oidc') // TODO: (now) Make not optional
  scope: z.string().optional(), // OAuth token scope
  id_token: z.string().optional(), // ID token (for OpenID Connect)
  session_state: z.string().optional() // OAuth session state
  // ? (found in TokenEndpointResponse) authorization_details: z.string().optional()
});

export const VerificationTokenSchema = z.object({
  id: z.string().uuid(),
  identifier: z.string(), // Usually an email or some unique identifier
  token: z.string(), // The actual verification token
  expires: z.date() // Expiration date of the token
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  sessionToken: z.string(), // Unique session token
  userId: z.string().uuid(), // Foreign key to User.id
  expires: z.date() // Expiration date for the session
});

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const UserRoleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(), // Relational field (UUID)
  organizationId: z.string().uuid(), // Relational field (UUID)
  role: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const SubscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  billingCycle: z.enum(['monthly', 'yearly']),
  apiLimit: z.number().optional(),
  featureLimits: z.record(z.string()).optional(), // Key-value pair of feature limits
  isActive: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const OrganizationSubscriptionSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  planId: z.string().uuid(),
  startDate: z.date(),
  nextBillingDate: z.date(),
  status: z.enum(['active', 'canceled']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  planId: z.string().uuid(),
  amount: z.number(),
  paymentDate: z.date(),
  status: z.enum(['successful', 'failed']),
  createdAt: z.date().optional()
});

export const UsageTrackingSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  feature: z.string(), // The feature being tracked, e.g., 'api_calls', 'storage'
  usedAmount: z.number(), // Usage amount (e.g., number of API calls)
  usageDate: z.date()
});

export const ApiCallSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  endpoint: z.string(),
  responseTimeMs: z.number(),
  costPerCall: z.number(),
  callDate: z.date()
});

// Schema map for entities
// Use SINGULAR table names, e.g. 'User', based on the entity's name.
const dbSchemaV1: Schema = {
  User: UserSchemaV1
};

const dbSchemaV2: Schema = {
  User: UserSchema,
  Account: AccountSchema,
  VerificationToken: VerificationTokenSchema,
  Session: SessionSchema,
  Organization: OrganizationSchema,
  UserRole: UserRoleSchema,
  SubscriptionPlan: SubscriptionPlanSchema,
  OrganizationSubscription: OrganizationSubscriptionSchema,
  Payment: PaymentSchema,
  UsageTracking: UsageTrackingSchema,
  ApiCall: ApiCallSchema
};

// type DbSchemaHistory, however, we need it to be derived for SchemaVersion below.
export const dbSchemaHistory = {
  v1: {
    schema: dbSchemaV1,
    planHook: (plan: MigrationPlan) => plan
  },
  v2: {
    schema: dbSchemaV2,
    planHook: (plan: MigrationPlan) => plan
  }
  // ... more versions later
} as const;
export type SchemaVersion = keyof typeof dbSchemaHistory;

export const dbSchema = Object.values(dbSchemaHistory).at(-1)?.schema ?? ({} as Schema);

// TypeScript types inferred from Zod schemas
export type User = z.infer<typeof dbSchema.User>;
export type Account = z.infer<typeof dbSchema.Account>;
export type VerificationToken = z.infer<typeof dbSchema.VerificationToken>;
export type Session = z.infer<typeof dbSchema.Session>;
export type Organization = z.infer<typeof dbSchema.Organization>;
export type UserRole = z.infer<typeof dbSchema.UserRole>;
export type SubscriptionPlan = z.infer<typeof dbSchema.SubscriptionPlan>;
export type OrganizationSubscription = z.infer<typeof dbSchema.OrganizationSubscription>;
export type Payment = z.infer<typeof dbSchema.Payment>;
export type UsageTracking = z.infer<typeof dbSchema.UsageTracking>;
export type ApiCall = z.infer<typeof dbSchema.ApiCall>;

export interface DatabaseSchemaType {
  User: User;
  Account: Account;
  VerificationToken: VerificationToken;
  Session: Session;
  Organization: Organization;
  UserRole: UserRole;
  SubscriptionPlan: SubscriptionPlan;
  OrganizationSubscription: OrganizationSubscription;
  Payment: Payment;
  UsageTracking: UsageTracking;
  ApiCall: ApiCall;
}

export async function seedDevData<TDatabase>(db: IDatabase<TDatabase>): Promise<void> {
  const initialUsers: User[] = [
    {
      id: '1',
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash: ''
    },
    {
      id: '2',
      name: 'John Doe',
      email: 'john.doe@example.com',
      passwordHash: ''
    },
    {
      id: '3',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      passwordHash: ''
    }
    // Add more users as needed
  ];

  for (const user of initialUsers) {
    await db.create('User', user);
  }
}

export async function seedProductionData<TDatabase>(db: IDatabase<TDatabase>): Promise<void> {
  const productionUsers: User[] = [
    {
      id: 'admin',
      name: 'Admin User',
      email: 'admin@yourapp.com',
      passwordHash: ''
    }
  ];

  for (const user of productionUsers) {
    await db.create('User', user);
  }
}
