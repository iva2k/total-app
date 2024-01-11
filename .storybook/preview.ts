import '../src/routes/styles.css';

import type { Preview } from '@storybook/svelte';
// import { themes } from '@storybook/theming';
import yourTheme from './YourTheme.ts';

const preview: Preview = {
  parameters: {
    // for '@storybook/theming':
    docs: {
      // theme: themes.dark
      theme: yourTheme
    },
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
