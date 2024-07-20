/**
 * Run a function inside Svelte's effect context
 * (From <https://github.com/skeletonlabs/floating-ui-svelte/blob/main/src/lib/utils/test.svelte.ts>)
 * Usage:
 * ```js
 * import { describe, expect, expectTypeOf, it, vi } from 'vitest';
 * import { withEffect } from '../../utils/test.svelte.js';
 * import { useFloating, type FloatingContext } from './index.svelte.js';
 * import {
 *   offset,
 *   type Middleware,
 *   type MiddlewareData,
 *   type Placement,
 *   type Strategy,
 * } from '@floating-ui/dom';
 * import { useId } from '../useId/index.js';
 *
 * function createElements(): { reference: HTMLElement; floating: HTMLElement } {
 *   const reference = document.createElement('div');
 *   const floating = document.createElement('div');
 *   reference.id = useId();
 *   floating.id = useId();
 *   return { reference, floating };
 * }
 *
 * describe('useFloating', () => {
 *   describe('elements', () => {
 *     it(
 *       'can be set',
 *       withEffect(() => {
 *         const elements = createElements();
 *         const floating = useFloating({ elements });
 *         expect(floating.elements).toEqual(elements);
 *       }),
 *     );
 * ...
 *   });
 * });
 * ```
 */
export function withEffect(fn: () => void) {
  return async () => {
    let promise;
    const cleanup = $effect.root(() => (promise = fn()));
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      return await promise;
    } finally {
      cleanup();
    }
  };
}
