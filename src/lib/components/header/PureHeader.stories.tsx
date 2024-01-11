// import type { Story } from '@storybook/addon-svelte-csf';
import type { Slots, Story, StoryProps } from '@storybook/addon-svelte-csf';
import type { SvelteComponentTyped } from 'svelte';
import PureHeader from './PureHeader.svelte';

export default {
  title: 'PureHeader',
  component: PureHeader,
  tags: ['autodocs'],
  argTypes: {
    // Note: For Typescript, keep argTypes in sync with argParams below.
    pathname: {
      options: ['/', '/about', '/sverdle'],
      control: { type: 'radio' }
    }
  }
};

// Note: For Typescript, keep argParams in sync with export default.argTypes above.
type argParams = {
  pathname?: string;
};

const Template: Story = ((args: argParams) => ({
  Component: PureHeader,
  props: args
  // TODO: (later) Need a better fix. This typescript gymnastics does not make any sense whatsoever, but it makes TS errors go away.
})) as unknown as SvelteComponentTyped<StoryProps, Record<string, never>, Slots>;

export const Primary = Template.bind({});
Primary.args = {
  pathname: '/about'
};

//export const Secondary = Template.bind({});
//Secondary.args = {
//  pathname: false,
//};
