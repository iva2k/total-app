<script lang="ts">
  import { Button, Switch, Text, Title } from '@svelteuidev/core';

  let clicked = false;

  let count = 0;
  function increment() {
    count++;
  }

  let isDark = false;
  function toggleTheme() {
    isDark = !isDark;
  }
  // Adds margin-top to elements with this obj in the override prop
  const override = {
    mt: '$10'
  };
</script>

<Button onclick={() => (clicked = true)}>
  {clicked ? "Don't click me anymore" : 'Click me'}
</Button>

<Title {override} align="center">Hello CodeSandbox</Title>
<Title {override} align="center" order={2}>Start editing to see some magic happen!</Title>
<div class="my-container">
  <Button onclick={increment}>Click Me</Button>
  <Text>Count: {count}</Text>
</div>
<div class="my-container">
  <Switch size="lg" label="{isDark ? 'dark' : 'light'} mode" onchange={toggleTheme} />
</div>

<style>
  .my-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 1rem auto;
  }
</style>
