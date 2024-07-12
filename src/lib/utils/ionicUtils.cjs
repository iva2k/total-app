// We keep this file .cjs to avoid TypeScript madness which happens when
// trying to get defineCustomElements imported into .svelte file.
// However, svelte-check still barks on lack of type in .cjs file.
// Therefore, we use "// @ts-ignore" to shut up these errors, and it works.
// TODO: (soon) File a proper issue with svelte-check

/** @type {import("@ionic/pwa-elements/loader").defineCustomElements} */
// @ts-ignore
import { defineCustomElements } from '@ionic/pwa-elements/loader/index.cjs.js';

export const loadIonicPWAElements = async (
  // @ts-ignore
  w
) => {
  await defineCustomElements(w);
};
