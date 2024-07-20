import { defineWorkspace } from 'vitest/config';
// ? import viteConfig from './vite.config';

export default defineWorkspace([
  // ? './vite.config.ts'
  // ? viteConfig
  {
    extends: './vite.config.ts',
    test: {
      typecheck: { tsconfig: 'tsconfig.json' }
    }
  }
]);
