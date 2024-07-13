// ESLint confit compatible with flat config ESLint v9

// From <https://github.com/sveltejs/eslint-plugin-svelte/issues/732#issuecomment-2156240189>

// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Plugins
const { plugin: tsPlugin } = tseslint;
import sveltePlugin from 'eslint-plugin-svelte';
// import eslintImport from 'eslint-plugin-import';
import pluginImportX from 'eslint-plugin-import-x';
import playwright from 'eslint-plugin-playwright';
import vitest from 'eslint-plugin-vitest';

// Parsers
const { parser: tsParser } = tseslint;
import svelteParser from 'svelte-eslint-parser';
import * as tsExtraFilesParser from 'typescript-eslint-parser-for-extra-files';

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

import fs from 'fs';
import { parse } from 'comment-json';

// const project = ["./tsconfig.json"];
const project = ['./tsconfig.json', './tsconfig.lint.json', './tsconfig.configs.json'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ? const __dirname = import.meta.dirname,

function readJson(file) {
  const file_path = path.join(__dirname, file);
  try {
    // console.log(`Reading "${file_path}"`);
    const blob = fs.readFileSync(file_path);
    const res = parse(blob.toString(), null, true); // Remove comments
    // console.log(`DONE Reading "${file_path}"`);
    // console.debug(`  + File "${file_path}" content:\n${JSON.stringify(res)}`);
    return res;
  } catch (e) {
    console.error(`FAIL Reading "${file_path}", error ${e}`);
    throw e;
  }
}

/** @type (obj: Object, prop: string, old_prefix: string, new_prefix?: string) => string[] */
function arrayFilePathsDeprefix(obj, prop, old_prefix, new_prefix = '') {
  if (obj instanceof Object && prop in obj && Array.isArray(obj[prop]))
    return (
      obj[prop]?.map((ss) => {
        const s = typeof ss === 'string' ? ss : '';
        return s.startsWith(old_prefix) ? new_prefix + s.slice(old_prefix.length) : s;
      }) ?? []
    );
  return [];
}

/** @type (obj_arr: Object[]) => typeof obj_arr */
function patchFilesPrefix(obj_arr) {
  return (
    obj_arr?.map((obj) => {
      const prop = 'files';
      if (obj instanceof Object && prop in obj && Array.isArray(obj[prop])) {
        obj[prop] = arrayFilePathsDeprefix(obj, prop, '*.', '**/*.');
      }

      return obj;
    }) ?? obj_arr
  );
}

// Data from tsconfig.*.json
// import tsConfigForConfigFiles from './tsconfig.configs.json' assert { type: 'json' };
// import tsConfigForLintFiles from './tsconfig.lint.json' assert { type: 'json' };
// import tsConfigForTsFiles from './tsconfig.json' assert { type: 'json' };
const tsConfigForTsFiles = readJson('tsconfig.json');
const tsConfigForTsFilesExclude = arrayFilePathsDeprefix(tsConfigForTsFiles, 'exclude', './');
// console.debug(`tsConfigForTsFilesExclude=${tsConfigForTsFilesExclude}`);

const tsConfigForConfigFiles = readJson('./tsconfig.configs.json');
const tsConfigForConfigFilesInclude = arrayFilePathsDeprefix(
  tsConfigForConfigFiles,
  'include',
  './'
);

const tsConfigForLintFiles = readJson('./tsconfig.lint.json');
const tsConfigForLintFilesInclude = arrayFilePathsDeprefix(tsConfigForLintFiles, 'include', './');

// Method 3 to import JSON
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const tsConfigForTsFiles2 = require('./tsconfig.json');

/** @type {import('@eslint/eslintrc').FlatCompat} */
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
  recommendedConfig: eslint.configs.recommended,
  allConfig: eslint.configs.all
});

/** @typedef {import('@eslint/compat').FixupPluginDefinition } FixupPluginDefinition */
/** @type {(name: string, alias: string) => FixupPluginDefinition} */
function legacyPlugin(name, alias = name) {
  /** @type {FixupPluginDefinition} */
  const plugin = compat.plugins(name)[0]?.plugins?.[alias];

  if (!plugin) {
    throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
  }

  return fixupPluginRules(plugin);
}

// Rules for different languages
/** @typedef {import('@typescript-eslint/utils').TSESLint.SharedConfig.RulesRecord} RulesRecord */
/** @type Record<string, RulesRecord> */
const RULES = {
  ts: {
    // '@typescript-eslint/no-unused-vars': [
    //   'error',
    //   {
    //     argsIgnorePattern: '^_',
    //     varsIgnorePattern: '^_',
    //     caughtErrorsIgnorePattern: '^_',
    //     destructuredArrayIgnorePattern: '^_'
    //   }
    // ],

    // TODO: (now) Fix all these rules below. Turned off when upgraded eslint to v9 to pass `pnpm run lint`.
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/require-await': 'off',

    // import-x:
    'import-x/no-named-as-default-member': 'off'
  }
};

export default tseslint.config(
  {
    // Recommended configs
    name: 'config-recommended',
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        // project: './tsconfig.json',
        project,
        extraFileExtensions: ['.Xrecommended'],
        tsconfigRootDir: __dirname
      }
    },
    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      'import-x/resolver': {
        // Load <rootdir>/tsconfig.json
        typescript: true,
        node: true
      }
    }
  },

  // Rules from legacy plugins
  ...fixupConfigRules(
    compat.extends(
      // 'plugin:import/recommended',
      // 'plugin:import/typescript',
      'plugin:import-x/recommended',
      'plugin:import-x/typescript'
    )
  ),

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...sveltePlugin.configs['flat/recommended'],

  {
    // Basic js include files
    name: 'config-basic-js',
    files: ['**/*.js', '**/*.cjs', '**/*.mjs']
  },

  {
    // Ignore on all levels
    name: 'config-ignores',
    ignores: [
      // because of import assertion of tsconfig.json
      'eslint.config.js',

      // Use `.exclude` section from ./tsconfig.ts
      // Apparently, `project: 'tsconfig..json'` does not honor excludes.
      ...tsConfigForTsFilesExclude,

      // '**/*.cjs', // Various glue files?

      // OS
      '**/.DS_Store',
      '**/Thumbs.db',

      '.logo/',

      // Env
      '**/.env',
      '**/.env.*',
      '!**/.env.EXAMPLE',

      // Outputs
      '.output/',
      '.netlify/',
      '.vercel/',
      '.svelte-kit/',
      'build/',
      'package/',
      'static/vendor/',
      'dist/',

      // Generated
      '**/log.*',
      '**/*.log',
      'test-results/',
      '**/test-results.json',
      'src-tauri/target/',
      'src-tauri/WixTools/',
      'src-tauri/Cargo.lock',
      'playwright-report/',

      // Vite
      '**/vite.config.js.timestamp-*',
      '**/vite.config.ts.timestamp-*',

      // Local Files
      '**/*.local',
      '**/local.*',
      '**/*.nogit.*',

      // Package Managers
      // Ignore files for PNPM, NPM and YARN
      '**/package-lock.json',
      '**/pnpm-lock.yaml',
      '**/yarn.lock',
      'patches/'
    ]
  },

  {
    // Globals for nodejs files
    name: 'config-nodejs',
    files: ['**/*.cjs', '**/*.cts'],
    plugins: {
      import: legacyPlugin('eslint-plugin-import-x', 'import-x')
    },
    languageOptions: {
      globals: {
        ...globals.node
      },
      parserOptions: {
        project,
        extraFileExtensions: ['.Xnodejs'],
        tsconfigRootDir: __dirname
      }
    },
    rules: {
      ...RULES.ts
    }
  },

  {
    // Globals for browser files
    name: 'config-browser',
    files: ['**/*.js', '**/*.mjs', '**/*.ts', '**/*.mts', '**/*.svelte'],
    plugins: {
      import: legacyPlugin('eslint-plugin-import-x', 'import-x')
    },
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      ...RULES.ts
    }
  },

  {
    // Tools configs: *.config.ts files in root
    name: 'config-tools',
    files: tsConfigForConfigFilesInclude, // Use tsconfig.configs.json
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: legacyPlugin('eslint-plugin-import-x', 'import-x')
    },
    languageOptions: {
      globals: {
        ...globals.node
      },
      parser: tsParser,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.configs.json',
        extraFileExtensions: ['.Xtools'],
        tsconfigRootDir: __dirname
      }
    },
    rules: RULES.ts
  },

  {
    // Typescript
    name: 'config-typescript',
    files: ['**/*.ts', '**/*.cts', '**/*.mts'],
    ignores: tsConfigForConfigFilesInclude,
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: legacyPlugin('eslint-plugin-import-x', 'import-x')
    },
    languageOptions: {
      parser: tsExtraFilesParser,
      sourceType: 'module',
      parserOptions: {
        project,
        extraFileExtensions: ['.svelte', '.Xtypescript'],
        tsconfigRootDir: __dirname
      }
    },
    rules: RULES.ts
  },

  {
    // Svelte
    name: 'config-svelte',
    plugins: {
      svelte: sveltePlugin,
      '@typescript-eslint': tsPlugin,
      import: legacyPlugin('eslint-plugin-import-x', 'import-x')
    },
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsExtraFilesParser,
        svelteFeatures: {
          experimentalGenerics: true
        },
        project,
        extraFileExtensions: ['.svelte', '.Xsvelte'],
        tsconfigRootDir: __dirname
      }
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      ...RULES.ts
    }
  },

  /**/
  {
    // Playwright and Vitest
    name: 'config-playwright',
    ...playwright.configs['flat/recommended'],
    files: ['tests/**'], // or any other pattern
    plugins: {
      import: legacyPlugin('eslint-plugin-import-x', 'import-x'),
      vitest
    },
    rules: {
      ...vitest.configs.recommended.rules
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project,
          extraFileExtensions: ['.svelte', '.Xplaywright'],
          tsconfigRootDir: __dirname
        }
      },
      vitest: {
        typecheck: true
      }
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals
      }
    }
  }
  /**/
);
