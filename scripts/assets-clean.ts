#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import glob from 'glob';

import { cleanup } from '../assets.js';

const scriptFile = import.meta?.url || process.argv[1];
const scriptName = path.basename(scriptFile);
const reporter = console.log;

async function assetsClean() {
  await Promise.all(
    cleanup.map(async ({ dest }) => {
      glob(dest, {}, async (e, files) => {
        await Promise.all(
          files.map(async (f) => {
            const fPath = path.resolve(f);
            reporter('%s: + Removing "%s"', scriptName, f);
            await fs.promises.rm(fPath, { recursive: true, force: true });
          })
        );
      });
    })
  );
}

void (async function main() {
  reporter('%s: BEGIN', scriptName);
  await assetsClean();
  reporter('%s: DONE', scriptName);
})();
