<script lang="ts">
  /**
   *
   * @param event
   */

  // TODO: (now) on "register" error form goes to isLogin mode, and wording of the error description does not match, Use URL for the tab / mode (so outside links can choose the tab).
  // TODO: (now) Password recovery via email. Make a link, but show it as a tab along with Login/Register (use URL for the tab / mode)
  // TODO: (now) MFA
  // TODO: (now) Style OAuth login buttons, add icons (maybe from Auth.js lib)
  // TODO: (now) Erorrs due to entries validation inside Auth.js are not passed to us. Need either to make client-side validation, or make Auth.js pass more descriptive errors to us.

  import type { PageData } from './$types';
  import { SignIn } from '@auth/sveltekit/components';
  import { onMount } from 'svelte';
  import { signIn as signInAction, signOut as signOutAction } from '@auth/sveltekit/client';

  // import website from '$lib/config/website';
  // const { siteConfig } = website;

  let { data }: { data: PageData } = $props();

  // State to toggle between Login and Register forms
  let isLogin = $state(true);

  // Registration & Login form fields
  let email = $state('');
  let password = $state('');
  let name = $state('');

  // Feedback messages
  let message = $state('');
  let error = $state('');

  const signinErrorsLogin: Record<string, string> = {
    // Copied from Auth.js
    default: 'Unable to sign in.',
    Signin: 'Try signing in with a different account.',
    OAuthSignin: 'Try signing in with a different account.',
    OAuthCallbackError: 'Try signing in with a different account.',
    OAuthCreateAccount: 'Try signing in with a different account.',
    EmailCreateAccount: 'Try signing in with a different account.',
    Callback: 'Try signing in with a different account.',
    OAuthAccountNotLinked:
      'To confirm your identity, sign in with the same account you used originally.',
    EmailSignin: 'The e-mail could not be sent.',
    CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
    SessionRequired: 'Please sign in to access this page.'
  };
  const signinErrorsRegister: Record<string, string> = {
    // Copied from Auth.js
    default: 'Unable to sign in.',
    Signin: 'Try signing in with a different account.',
    OAuthSignin: 'Try signing in with a different account.',
    OAuthCallbackError: 'Try signing in with a different account.',
    OAuthCreateAccount: 'Try signing in with a different account.',
    EmailCreateAccount: 'Try signing in with a different account.',
    Callback: 'Try signing in with a different account.',
    OAuthAccountNotLinked:
      'To confirm your identity, sign in with the same account you used originally.',
    EmailSignin: 'The e-mail could not be sent.',
    CredentialsSignin: 'Registration in failed. Check the details you provided are correct.',
    SessionRequired: 'Please sign in to access this page.'
  };
  const errorText = $derived(
    error &&
      ((isLogin ? signinErrorsLogin : signinErrorsRegister)[error] ??
        (isLogin ? signinErrorsLogin : signinErrorsRegister).default + ` (${error})`)
  );

  // Parse URL parameters for messages
  onMount(async () => {
    // TODO: (now) Make it more Svelte:
    const params = new URLSearchParams(window.location.search);
    if (params.has('error')) {
      error = params.get('error') || '';
    }
    if (params.has('message')) {
      message = params.get('message') || '';
    }
  });

  /**
   * Handles user registration by sending a POST request to the /api/register endpoint.
   */
  async function register(event: Event) {
    event.preventDefault();
    const response = await signInAction('credentials', {
      redirect: true,
      email,
      password: password,
      name: name,
      isRegister: true
    });
    console.log('Registration response:', response);
  }

  /**
   * Handles user login by sending a POST request to the /api/login endpoint.
   */
  async function login(event: Event) {
    event.preventDefault();
    const response = await signInAction('credentials', {
      redirect: true,
      email: email,
      password: password
    });
    console.log('Login response:', response);
  }

  /**
   * Handles user logout by sending a POST request to the /api/logout endpoint.
   */
  async function logout(event: Event) {
    event.preventDefault();
    await signOutAction();
  }
</script>

<div class="auth-header">
  {#if data.session}
    <h1>User Authentication</h1>
  {:else}
    <h1>User Signin</h1>
  {/if}
</div>

<div class="container">
  {#if data.session}
    <!-- User Logged In: Display User Information and Logout Option -->
    <div class="user-info">
      {#if data.session.user?.image}
        <img src={data.session.user.image} class="avatar" alt="User Avatar" />
      {/if}
      <h2>Signed in as</h2>
      <span class="signedInText">
        <strong>
          {data.session.user?.name || data.session.user?.email}
        </strong>
      </span>

      <button class="logout-button" onclick={logout}>Log Out</button>
    </div>
  {:else}
    <!-- User NOT Logged In: Toggle between Login and Register -->
    <div class="toggle">
      <button
        class={isLogin ? 'active' : ''}
        onclick={() => {
          isLogin = true;
          error = '';
          message = '';
        }}
      >
        Login
      </button>
      <button
        class={!isLogin ? 'active' : ''}
        onclick={() => {
          isLogin = false;
          error = '';
          message = '';
        }}
      >
        Register
      </button>
    </div>

    {#if isLogin}
      <!-- Login Form -->
      <form onsubmit={login}>
        <h2>Sign in with Email</h2>
        <input type="email" bind:value={email} placeholder="Email" required />
        <input type="password" bind:value={password} placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    {:else}
      <!-- Registration Form -->
      <form onsubmit={register}>
        <h2>Register with Email</h2>
        <input type="email" bind:value={email} placeholder="Email" required />
        <input type="password" bind:value={password} placeholder="Password" required />
        <input type="text" bind:value={name} placeholder="Name (optional)" />
        <button type="submit">Register</button>
      </form>
    {/if}
    <hr />
    <!-- OAuth2 Login Buttons -->
    <div class="oauth-buttons">
      {#each data?.providerMap ?? [] as provider}
        {#if provider.id !== 'credentials'}
          <SignIn provider={provider.id} className="w-full">
            <div slot="submitButton" class="button">
              <span>
                Sign in with {provider.name}
              </span>
            </div>
          </SignIn>
        {/if}
      {/each}
    </div>

    <!-- Display Feedback Messages -->
    {#if message}
      <div class="message">{message}</div>
    {/if}
    {#if error}
      <div class="error">{errorText}</div>
    {/if}
  {/if}
</div>

<style>
  /* Container styling */
  .container {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid hsl(var(--color-surface-content) / 20%);
    border-radius: 0.25rem;
    background-color: hsl(var(--color-surface-100));
    color: hsl(var(--color-surface-content));
  }

  /* Separator before OAuth buttons */
  .container hr {
    display: block;
    border: 0;
    border-top: 1px solid hsl(var(--color-surface-content));
    margin: 2rem auto 1rem auto;
    overflow: visible;
    text-align: center;
  }
  .container hr::before {
    content: 'or';
    background: hsl(var(--color-surface-100));
    color: #888;
    padding: 0 0.4rem;
    position: relative;
    top: -0.9rem;
  }

  /* Toggle buttons styling */
  .toggle {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
  }

  .toggle button {
    flex: 1;
    padding: 10px;
    margin: 0 5px;
    font-size: 1em;
    cursor: pointer;
    background-color: hsl(var(--color-surface-200));
    border: none;
    border-top: 2px solid transparent;
    transition: border-yop 0.3s;
  }

  .toggle button.active {
    background-color: hsl(var(--color-surface-100));
    border-top: 2px solid hsl(var(--color-primary));
    font-weight: bold;
  }

  /* Form styling */
  :global(form.signInButton), /* For Auth.js SignIn component */
  div.user-info,
  form {
    display: flex;
    flex-direction: column;
  }
  form h2 {
    text-align: center;
    margin-bottom: 20px;
  }

  form input {
    padding: 10px;
    margin-bottom: 15px;
    font-size: 1em;
    border: 1px solid hsl(var(--color-surface-content) / 20%);
    border-radius: 0.25rem;
  }

  form input:focus,
  form input:hover {
    border-color: hsl(var(--color-surface-content) / 60%);
  }

  /* form div.button, */
  form button {
    padding: 10px;
    font-size: 1em;
    background-color: hsl(var(--color-primary));
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  form button:hover,
  form button:focus {
    /* background-color: hsl(var(--color-primary) / var(--tw-bg-opacity)); */
    opacity: 0.9;
  }

  /* OAuth buttons styling */
  .oauth-buttons {
    display: flex;
    flex-direction: column;
    margin-top: 15px;
  }

  .oauth-buttons div.button {
    padding: 10px;
    font-size: 1em;
    margin-bottom: 10px;
    background-color: #db4437; /* Google Red */
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  /*
.oauth-buttons button.github {
  background-color: #333; /* GitHub Black * /
}
/**/

  .oauth-buttons div.button:hover,
  .oauth-buttons div.button:focus {
    opacity: 0.9;
  }

  /* Feedback messages styling */
  .message {
    color: green;
    text-align: center;
    margin-top: 15px;
  }

  .error {
    color: red;
    text-align: center;
    margin-top: 15px;
  }

  /* User Info Styling */
  .user-info {
    text-align: center;
    margin-bottom: 20px;
  }
  .user-info img {
    display: block;
  }

  .logout-button {
    padding: 10px 20px;
    font-size: 1em;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .logout-button:hover,
  .logout-button:focus {
    background-color: #c82333;
  }
</style>
