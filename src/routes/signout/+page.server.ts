import { signOut } from '$lib/services/authService';
import type { Actions } from './$types';
export const actions: Actions = { default: signOut };
