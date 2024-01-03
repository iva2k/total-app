#!/usr/bin/env node

import path from 'path';
import cpy from 'cpy';

import assets from '../assets.js';

const scriptFile = import.meta?.url || process.argv[1];
const scriptName = path.basename(scriptFile);
const reporter = console.log;

async function assetsCopy() {
  await Promise.all(
    assets.map(async ({ src, dest }) => {
      reporter('%s: + Copying %s to %s', scriptName, src, dest);
      await cpy(src, dest);
    })
  );
}

void (async function main() {
  reporter('%s: BEGIN', scriptName);
  await assetsCopy();
  reporter('%s: DONE', scriptName);
})();
