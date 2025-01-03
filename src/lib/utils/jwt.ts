import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import type { User } from '$lib/db-schema';

// Define the payload structure
interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

// Sign a JWT
export function signToken(user: User, options?: SignOptions): string {
  const JWT_SECRET = env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  const expiresIn = env.JWT_EXPIRES ?? '1h';

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    name: user.name
  };
  const opts: SignOptions = {
    expiresIn,
    issuer: 'your-app-name', // TODO: (now) Replace with your app's name, use websiteFnc config.
    ...options
  };

  return jwt.sign(payload, JWT_SECRET, opts);
}

// Verify a JWT
export function verifyToken(token: string): JWTPayload | null {
  const JWT_SECRET = env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  const options: VerifyOptions = {
    issuer: 'your-app-name', // TODO: (now) Replace with your app's name, use websiteFnc config.
    complete: false
  } as const;
  try {
    const payload = jwt.verify(token, JWT_SECRET, options) as unknown as JWTPayload;
    return payload;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
}

/**
 * Converts JWT_EXPIRES string to seconds.
 * @param expiry - Expiration string (e.g., '1h', '7d')
 * @returns Expiration time in seconds.
 */
export function parseDuration(expiry: string): number {
  const timeValue = parseInt(expiry.slice(0, -1));
  const timeUnit = expiry.slice(-1);

  switch (timeUnit) {
    case 's':
      return timeValue;
    case 'm':
      return timeValue * 60;
    case 'h':
      return timeValue * 60 * 60;
    case 'd':
      return timeValue * 60 * 60 * 24;
    default:
      return 3600; // Default to 1 hour
  }
}
