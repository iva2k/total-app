import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vite.config.ts',
    test: {
      typecheck: { tsconfig: 'tsconfig.json' }
    }
  }
]);
