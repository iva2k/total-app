<script lang="ts">
  import { type ComponentProps } from 'svelte';
  import {
    Button,
    Theme,
    RadioButtonGroup,
    RadioButton,
    breakpoints
  } from 'carbon-components-svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import Add from 'carbon-icons-svelte/lib/Add.svelte';
  import Login from 'carbon-icons-svelte/lib/Login.svelte';

  // TODO: (when issue is fixed) `import { type CarbonTheme } from 'carbon-components-svelte'` is not working. See <https://github.com/carbon-design-system/carbon-components-svelte/issues/1910>
  // ? import type { CarbonTheme } from 'carbon-components-svelte'; // This should work after the issue #1910 is fixed.
  // ? import type { CarbonTheme } from 'carbon-components-svelte/types/Theme/Theme.svelte.js'; // This used to work some time ago
  // type CarbonTheme = 'white' | 'g10' | 'g80' | 'g90' | 'g100';
  // 3 ways to work around the issue:
  // import type { CarbonTheme } from 'carbon-components-svelte/src/Theme/Theme.svelte';
  // let theme: CarbonTheme = 'g90';
  // let theme = 'g90' as const;
  let theme: ComponentProps<Theme>['theme'] = 'g90' as const;
</script>

<Theme bind:theme persist persistKey="__carbon-theme" />

<RadioButtonGroup legendText="Carbon theme" bind:selected={theme}>
  {#each ['white', 'g10', 'g80', 'g90', 'g100'] as value}
    <RadioButton labelText={value} {value} />
  {/each}
</RadioButtonGroup>

<Button>Primary button</Button>

<Button kind="secondary">Secondary button</Button>

<Button kind="tertiary">Tertiary button</Button>

<Button kind="ghost">Ghost button</Button>

<Button kind="danger">Danger button</Button>

<Button kind="danger-tertiary">Danger tertiary button</Button>

<Button kind="danger-tertiary" iconDescription="Delete" icon={TrashCan} />

<Button kind="danger-ghost">Danger ghost button</Button>

<Button icon={Add}>With icon</Button>

<Button iconDescription="Tooltip text" icon={Add} />

<Button iconDescription="Login" icon={Login} href="#" />

<Button tooltipPosition="right" tooltipAlignment="end" iconDescription="Tooltip text" icon={Add} />

{JSON.stringify(breakpoints)}
