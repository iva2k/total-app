import type { Actions } from './$types';
import { signIn } from '$lib/services/authService';
export const actions: Actions = { default: signIn };
