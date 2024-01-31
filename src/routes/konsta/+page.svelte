<script lang="ts">
  import { App, Page, Navbar, Block, BlockTitle, Button, List, ListItem } from 'konsta/svelte';
</script>

<App theme="ios">
  <Page>
    <Navbar title="My App" />
    <Block>
      <p>Here comes my app</p>
    </Block>
    <BlockTitle>Navigation</BlockTitle>
    <List>
      <ListItem href="/" title="Home" />
      <ListItem href="/about" title="About" />
    </List>
    <Block class="space-y-4">
      <p>Here comes the button</p>
      <Button>Action</Button>
    </Block>
  </Page>
</App>
