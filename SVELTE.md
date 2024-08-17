# Svelte 5 and SvelteKit 2

## Peculiarities

Peculiarities encountered in Svelte 5 and SvelteKit 2.

### `./$types`

Works:

```ts
import type { PageServerLoad } from './$types';
```

Doesn't work:

```ts
import { type PageServerLoad } from './$types';
```

### Lifecycle and Context

`setContext()`, `getContext()` and `hasContext()` don't work and throw errors in modules if not called from `onMount()` or called on the server side.

As an extension, `useState()` does not work in the same situations.

### Runes type definitions

`$props` cannot take type parameter, should use type on the left-hand side. `$state` type on left-hand side does not work well, should use type parameter.

Works:

```ts
let { value }: { value: ValueType } = $props();
let value = $state<ValueType>(initialValue);
```

Does not work:

```ts
let { value } = $props<{ value: ValueType }>();
let value: ValueType = $state(initialValue);
```

## ChatGPT Prompts

### Generate Svelte 5 / SvelteKit 2 code

System prompt:

```text
Use Svelte 5 runes. They are not imported but compiled, `let value = $state<valueType>(initialValue);` and `value` can be read or set directly, it will be reactive. For component props, use `let { prop1, prop2, ...args } : { prop1: prop1Type, prop2: prop2Type, ... } = $props();`
```
