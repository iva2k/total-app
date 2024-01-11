// import type { Story } from '@storybook/addon-svelte-csf';
import type { Slots, Story, StoryProps } from '@storybook/addon-svelte-csf';
import type { SvelteComponentTyped } from 'svelte';

import Counter from './Counter.svelte';

export default {
  title: 'Counter',
  component: Counter,
  argTypes: {
    // Note: For Typescript, keep argTypes in sync with argParams below.
    count: {
      control: {
        type: 'number'
      },
      defaultValue: 11,
      name: 'count',
      type: { name: 'number', required: false }
    }
  }
};

// Note: For Typescript, keep argParams in sync with export default.argTypes above.
type argParams = {
  count?: number;
};

const Template: Story = ((args: argParams) => ({
  Component: Counter,
  props: args
  // TODO: (later) Need a better fix. This typescript gymnastics does not make any sense whatsoever, but it makes TS errors go away.
})) as unknown as SvelteComponentTyped<StoryProps, Record<string, never>, Slots>;

export const Primary: Story = Template.bind({});
Primary.args = {
  count: 11
};

//export const Secondary = Template.bind({});
//Secondary.args = {
//  primary: false,
//};
