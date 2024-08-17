// We keep this file .cjs to avoid TypeScript madness which happens when
// trying to get defineCustomElements imported into .svelte file.
// However, svelte-check still barks on lack of type in .cjs file.
// Therefore, we use "// @ts-ignore" to shut up these errors, and it works.
// TODO: (soon) File a proper issue with svelte-check

/** @type {import("@ionic/pwa-elements/loader").defineCustomElements} */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { defineCustomElements } from '@ionic/pwa-elements/loader/index.cjs.js';

// export // <-- `ESM syntax is not allowed in a CommonJS module when 'verbatimModuleSyntax' is enabled.ts(1286)`
const loadIonicPWAElements = async (
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  w
) => {
  await defineCustomElements(w);
};

// export default loadIonicPWAElements; // <-- `ESM syntax is not allowed in a CommonJS module when 'verbatimModuleSyntax' is enabled.ts(1286)`

// This named ESM export is not showing any ts errors:
export { loadIonicPWAElements };

// Though correct CJS, this breaks `vite dev` with "module is not defined" or "exports is not defined":
// module.exports = loadIonicPWAElements;
// module.exports.loadIonicPWAElements = loadIonicPWAElements;
// exports.loadIonicPWAElements = loadIonicPWAElements;
