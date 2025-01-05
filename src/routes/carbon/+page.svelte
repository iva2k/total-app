<script lang="ts">
  import { Button, breakpoints } from 'carbon-components-svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import Add from 'carbon-icons-svelte/lib/Add.svelte';
  import Login from 'carbon-icons-svelte/lib/Login.svelte';
</script>

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
