<script lang="ts">
  import { App, Page, Navbar, Toolbar, Link, View } from 'framework7-svelte';

  // Demo Theme
  let theme = 'auto';
  const f7Params = {
    id: 'io.framework7.testapp',
    name: 'My App',
    theme,
    // routes,
    routes: [],
    // store,
    // store: {},
    popup: {
      closeOnEscape: true
    },
    sheet: {
      closeOnEscape: true
    },
    popover: {
      closeOnEscape: true
    },
    actions: {
      closeOnEscape: true
    }
  };
</script>

<svelte:head>
  <title>Framework7</title>
  <meta name="description" content="A todo list app" />
</svelte:head>

<App {...f7Params}>
  <View main>
    <!--  Initial Page -->
    <Page>
      <!-- Top Navbar -->
      <Navbar title="Awesome App" />
      <!-- Toolbar -->
      <Toolbar bottom>
        <Link>Link 1</Link>
        <Link>Link 2</Link>
      </Toolbar>
      <!-- Page Content -->
      <p>Page content goes here</p>
      <Link href="/about">About App</Link>
    </Page>
  </View>
</App>

<style>
  :global(.page) {
    position: static !important; /* Framework7 (v7.1.1) does not show its content without this hack*/
  }
</style>
