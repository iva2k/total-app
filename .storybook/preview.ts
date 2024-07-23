import '../src/routes/styles.css';
import '../src/routes/(demo)/styles.css';

import type { Preview, SvelteRenderer as Renderer } from '@storybook/svelte';
// import { themes } from '@storybook/theming';
import yourTheme from './YourTheme.ts';

import { withThemeByDataAttribute, withThemeByClassName } from '@storybook/addon-themes';

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute<Renderer>({
      themes: {
        light: '',
        dark: 'dark'
      },
      defaultTheme: 'light',
      attributeName: 'color-scheme'
    }),
    withThemeByClassName<Renderer>({
      themes: {
        light: '',
        dark: 'dark'
      },
      defaultTheme: 'light'
    })
  ],
  parameters: {
    // for '@storybook/theming':
    docs: {
      // theme: themes.dark
      theme: yourTheme
    },
    // for 'essentials-backgrounds'
    // backgrounds: {
    //   values: [
    //     { name: 'twitter', value: '#00aced' },
    //     { name: 'facebook', value: '#3b5998' }
    //   ]
    // }
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
