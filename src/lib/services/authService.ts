import { dev } from '$app/environment';
import { SvelteKitAuth, type SvelteKitAuthConfig, CredentialsSignin } from '@auth/sveltekit';
import Credentials from '@auth/sveltekit/providers/credentials';
import type { Provider } from '@auth/core/providers';
import { ensureString } from '$lib/utils/appUtils';
import { createAuthAdapter } from '$lib/dal/auth-dal-adapter';

// import Apple from '@auth/sveltekit/providers/apple';
// import Auth0 from '@auth/sveltekit/providers/auth0';
// import AzureB2C from '@auth/sveltekit/providers/azure-ad-b2c';
// import BoxyHQSAML from '@auth/sveltekit/providers/boxyhq-saml';
// import Cognito from '@auth/sveltekit/providers/cognito';
// import Coinbase from '@auth/sveltekit/providers/coinbase';
// import Discord from '@auth/sveltekit/providers/discord';
// import Dropbox from '@auth/sveltekit/providers/dropbox';
// import Facebook from '@auth/sveltekit/providers/facebook';
// import GitHub from '@auth/sveltekit/providers/github';
// import GitLab from '@auth/sveltekit/providers/gitlab';
// import Google from '@auth/sveltekit/providers/google';
// import Hubspot from '@auth/sveltekit/providers/hubspot';
// import Keycloak from '@auth/sveltekit/providers/keycloak';
// import LinkedIn from '@auth/sveltekit/providers/linkedin';
// import Netlify from '@auth/sveltekit/providers/netlify';
// import Okta from '@auth/sveltekit/providers/okta';
// import Passage from '@auth/sveltekit/providers/passage';
// import Pinterest from '@auth/sveltekit/providers/pinterest';
// import Reddit from '@auth/sveltekit/providers/reddit';
// import Slack from '@auth/sveltekit/providers/slack';
// import Spotify from '@auth/sveltekit/providers/spotify';
// import Twitch from '@auth/sveltekit/providers/twitch';
// import Twitter from '@auth/sveltekit/providers/twitter';
// import WorkOS from '@auth/sveltekit/providers/workos';
// import Zoom from '@auth/sveltekit/providers/zoom';

// TODO: (when needed) Figure out a fix for ESLint 'import-x/no-unresolved' error on '$env/static/public'
// eslint-disable-next-line import-x/no-unresolved
import * as env from '$env/static/private';

import { UserService } from '$lib/services/userService';
import { parseDuration } from '$lib/utils/jwt';
import { stringifyAnyError } from '$lib/utils/errorUtils';

// Use lazy initializationof SvelteKitAuth()
async function getProviders(): Promise<Provider[]> {
  // Configure your providers
  const providers: SvelteKitAuthConfig['providers'] = [
    // Login with Email provider
    Credentials({
      // Used for both register and login forms
      type: 'credentials',
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', about: 'Your full name', optional: true } // Only for when isRegister is set.
      },
      async authorize(credentials) {
        // Example from docs:
        // const response = await fetch(request);
        // if (!response.ok) return null;
        // return (await response.json()) ?? null;
        // let user = null;
        // logic to salt and hash password
        //  const pwHash = saltAndHashPassword(credentials.password);
        // logic to verify if user exists
        //  user = await getUserFromDb(credentials.email, pwHash);

        // Authenticate the user
        try {
          const userService = await UserService.create();
          if ((credentials as { isRegister: boolean }).isRegister) {
            // Register
            const user = await userService.registerUser({
              email: ensureString(credentials.email, 'email'),
              password: ensureString(credentials.password, 'password'),
              name: ensureString(credentials.name, 'name', true)
            });
            if (!user) {
              throw new Error('Registration failed.');
            }
            // return JSON object with the user data
            return user;
          } else {
            // Login
            const { user, token: _token } = await userService.loginUser({
              email: ensureString(credentials.email, 'email'),
              password: ensureString(credentials.password, 'password')
            });
            if (!user) {
              throw new Error('User not found.');
            }
            // return JSON object with the user data
            return user;
          }
        } catch (error) {
          // throwing CredentialsSignin ensures correct message and the user is redirected to the login page.
          throw new CredentialsSignin(stringifyAnyError(error));
        }
      }
    })
  ];
  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    providers.push(
      (await import('@auth/sveltekit/providers/google')).default({
        // clientId: env.AUTH_GOOGLE_ID,
        // clientSecret: env.AUTH_GOOGLE_SECRET
      })
    );
  }
  // Add other providers here
  return providers;
}

// Use lazy initializationof SvelteKitAuth()
const auth = SvelteKitAuth(async (_event) => {
  const providers = await getProviders();
  const options: SvelteKitAuthConfig = {
    debug: dev,
    providers,
    session: {
      strategy: 'jwt',
      maxAge: parseDuration(env.JWT_EXPIRES ?? '1h') // Convert expiration to seconds
      // updateAge:
    },
    // Use the custom database adapter
    adapter: createAuthAdapter(),
    secret: env.JWT_SECRET,
    basePath: '[origin]/api/auth/callback/[provider]',
    trustHost: env.AUTH_TRUST_HOST === 'true',
    callbacks: {
      async signIn({ user: _user, account, profile, email: _email, credentials: _credentials }) {
        // You can add additional checks here
        if (account?.provider === 'google') {
          return !!(profile?.email_verified && profile?.email);
        }
        return true;
      },
      async redirect({ url, baseUrl }) {
        // console.log(`Redirect URL: ${url}, baseUrl: ${baseUrl}`);
        // return baseUrl;
        return url.startsWith(baseUrl) ? url : baseUrl;
      },
      async session({ session, token, user: _user }) {
        // Customize session here if needed
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        return session;
      },
      async jwt({ token, user }) {
        // ... account, profile, isNewUser
        // Attach user information to the token
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        }
        return token;
      }
    },
    // useSecureCookies: true
    pages: {
      signIn: '/auth',
      signOut: '/auth'
    }
  };

  return options;
});

const { handle, signIn, signOut } = auth;
export { auth, handle as authenticationHandle, signIn, signOut, getProviders };
