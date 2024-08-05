#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Glob } from 'glob';

import { cleanup } from '../assets.js';

const scriptFile = import.meta?.url || process.argv[1];
const scriptName = path.basename(scriptFile);
const reporter = console.log;

async function assetsClean() {
  await Promise.all(
    cleanup.flatMap(async ({ dest }) => {
      const g = new Glob(dest, {});
      const tasks: Promise<void>[] = [];
      for await (const f of g) {
        const fPath = path.resolve(f);
        reporter('%s: + Removing "%s"', scriptName, f);
        tasks.push(fs.promises.rm(fPath, { recursive: true, force: true }));
      }
      return tasks;
    })
  );
}

void (async function main() {
  reporter('%s: BEGIN', scriptName);
  await assetsClean();
  reporter('%s: DONE', scriptName);
})();
