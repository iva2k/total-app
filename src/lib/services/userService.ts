import { z } from 'zod';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { getDatabase, getValidator } from '../dal/dal';
import type { DatabaseSchemaType, User } from '$lib/db-schema';
import type { IDatabase, IValidationService } from '$lib/dal/dal-types';
import { signToken } from '$lib/utils/jwt';

// Define input types for registration and login
interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface OAuthInput {
  email: string;
  name?: string;
  provider: string;
  providerId: string;
}

export class UserService {
  private readonly db: IDatabase<DatabaseSchemaType>;
  private readonly validator: IValidationService;

  constructor(db: IDatabase<DatabaseSchemaType>, validator: IValidationService) {
    this.db = db;
    this.validator = validator;
  }

  // Factory method to create an instance of UserService
  static async create(): Promise<UserService> {
    const db = await getDatabase<DatabaseSchemaType>();
    const validator = await getValidator();
    return new UserService(db, validator);
  }

  async getUser(id: string): Promise<Omit<User, 'passwordHash'>> {
    const fullUser = await this.db.findById<User>('User', id);
    const { passwordHash: _, ...userWithoutPassword } = fullUser;
    return userWithoutPassword;
  }

  /**
   * Registers a new user.
   * @param input - Registration input containing email, password, and optional name.
   * @returns The created user object without the password hash.
   * @throws Error if validation fails or user already exists.
   */
  async registerUser(input: RegisterInput): Promise<Omit<User, 'passwordHash'>> {
    // Define and parse the registration schema
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6, 'Password must be at least 6 characters long'),
      name: z.string().optional()
    });

    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const { email, password, name } = parsed.data;

    const transaction = await this.db.transaction();
    try {
      // Check if a user with the same email already exists
      const existingUsers = await this.db.findAll<User>('User'); // TODO: (now) Implement query by key,value
      if (existingUsers.some((user) => user.email === email)) {
        throw new Error('User with this email already exists');
      }

      // Hash the password securely
      const passwordHash = await bcrypt.hash(password, 10);

      // Create a new user object
      const newUser: User = {
        id: uuidv4(),
        email,
        passwordHash,
        name
      };

      // Save the new user in the database
      await transaction.create<User>('User', newUser);
      await transaction.commit();

      // Return the user object without the password hash
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Logs in an existing user.
   * @param input - Login input containing email and password.
   * @returns The authenticated user object without the password hash.
   * @throws Error if validation fails or authentication fails.
   */
  async loginUser(input: LoginInput): Promise<Omit<User, 'passwordHash'>> {
    // Define and parse the login schema
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6, 'Password must be at least 6 characters long')
    });

    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const { email, password } = parsed.data;

    // Retrieve all users and find the one with the matching email
    const users = await this.db.findAll<User>('User');
    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare the provided password with the stored password hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    const token = signToken(user);

    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  /**
   * Handles OAuth2 login/register
   * @param input - OAuth input containing email, name, provider, and providerId
   * @returns The user object (complete unsanitized)
   */
  async _oauthLoginEx(input: OAuthInput): Promise<{ user: User }> {
    const { email, name, provider, providerId } = input;

    // Check if user exists
    let user = await this.db
      .findAll<User>('User')
      .then((users) => users.find((u) => u.email === email));

    if (!user) {
      // Register new user via OAuth
      user = {
        id: uuidv4(),
        email,
        passwordHash: '', // No password as it's OAuth
        name,
        oauthProviders: [
          // TODO: (now) REMOVE (oauthProviders filed liquidated, use Account table instead)
          {
            provider,
            providerId
          }
        ]
      } as User;

      await this.db.create<User>('User', user);
    } else {
      // Optionally, update OAuth providers
      // For simplicity, omitted here
    }
    return { user };
  }
  async oauthLoginAndMakeToken(
    input: OAuthInput
  ): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const { user } = await this._oauthLoginEx(input);
    const token = signToken(user);
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  /**
   * Handles OAuth2 login/register
   * @param input - OAuth input containing email, name, provider, and providerId
   * @returns The user object (sanitized)
   */
  async oauthLogin(input: OAuthInput): Promise<{ user: Omit<User, 'passwordHash'> }> {
    const { user } = await this._oauthLoginEx(input);
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }
}
