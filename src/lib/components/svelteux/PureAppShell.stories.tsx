// import type { Story } from '@storybook/addon-svelte-csf';
import type { Slots, Story, StoryProps } from '@storybook/addon-svelte-csf';
import type { SvelteComponentTyped } from 'svelte';
// import type { Session } from '@auth/core/types';
import PureAppShell from './PureAppShell.svelte';

export default {
  title: 'PureAppShell',
  component: PureAppShell,
  tags: ['autodocs'],
  argTypes: {
    // Note: For Typescript, keep argTypes in sync with argParams below.
    pathname: {
      options: ['/', '/about', '/svelteux', '/flow', 'auth'],
      control: { type: 'radio' }
    },
    title: {
      control: 'text',
      description: 'Overwritten title'
    }
    //     themes: {},
    //     children: {}
  }
};

// Note: For Typescript, keep argParams in sync with export default.argTypes above.
type argParams = {
  pathname?: string;
  // session?: Session;
  title?: string;
  //   themes?: Record<string, string[]>;
  onSignout: () => void;
  //   children: Snippet;
};

const Template: Story = ((args: argParams) => ({
  Component: PureAppShell,
  props: args
  // TODO: (later) Need a better fix. This typescript gymnastics does not make any sense whatsoever, but it makes TS errors go away.
})) as unknown as SvelteComponentTyped<StoryProps, Record<string, never>, Slots>;

export const Primary = Template.bind({});
Primary.args = {
  pathname: '/',
  /* session: {
    user: {
      id: '123',
      email: 'user@example.com',
      name: 'Bored User',
      image: 'https://picsum.photos/100/100'
    }
  }, /* */
  title: 'My Awesome App'
};

//export const Secondary = Template.bind({});
//Secondary.args = {
//  pathname: false,
//};
