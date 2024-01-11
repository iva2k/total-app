import { addons } from '@storybook/manager-api';
// import { themes } from '@storybook/theming';

import yourTheme from './YourTheme.ts';

addons.setConfig({
  // theme: themes.dark
  theme: yourTheme
});
