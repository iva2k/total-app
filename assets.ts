import type { Target } from 'vite-plugin-static-copy';
export const cleanup = [
  // List of assets to be removed upon cleanup (can use glob / * wildcards)
  { dest: './static/vendor/*' }
];

const assets: Target[] = [
  // List of assets to be copied (can use glob / * wildcards)
  // Useful e.g. for dynamically loaded stylesheets.
  // Example: { src: 'node_modules/<module>/dist/*.css', dest: 'static/vendor/<module>/themes' }
  {
    src: 'node_modules/@shoelace-style/shoelace/dist/themes/*.css',
    dest: 'static/vendor/shoelace/themes'
  }
];

export default assets;
