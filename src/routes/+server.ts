import { redirect } from '@sveltejs/kit';

export function GET() {
  // We need "/" route to go into /(demo)/home, so it gets (demo)/+layout.svelte
  // 307 Temporary Redirect
  // throw redirect(307, '/home');
  redirect(307, '/home');
}
