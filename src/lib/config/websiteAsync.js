// This file exports websiteAsync() which is intended to be used from vite.config.ts

const websiteAsync = async (
  /** @type {Record<string, string>} */
  env
) => {
  const { default: websiteSync } = await import('./websiteFnc.js');
  return websiteSync(env);
};
export { websiteAsync as default };
