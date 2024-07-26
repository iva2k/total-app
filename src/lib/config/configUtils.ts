// Attention! Do not move this file away from website.js, websiteAsync.js, websiteFnc.js files. It must remain in the same directory, so getComponentPath() works properly
import { type Component } from 'svelte';
import { type SiteLink } from '$lib/types';

function getComponentPath(path: string, callerPath: string): string {
  // Resolve path to a resource specified relative to config/ directory, to the user module's callerPath
  // It does not preserve `?xxx` specifiers
  const mypath = import.meta.url;
  const sourceUrl = new URL(path, mypath); // Normalize path to "absolute" using mypath
  const resolvedUrl = new URL(sourceUrl, callerPath); // Normalize path to callerPath
  return resolvedUrl.pathname;
}

function getExtension(path: string) {
  return path.slice(((path.lastIndexOf('.') - 1) >>> 0) + 2);
}

export async function getSiteLinksComponents(
  siteLinks: SiteLink[],
  callerPath: string
): Promise<SiteLink[]> {
  const exts_str = ['svg'];
  const exts_nostr = ['svelte'];
  const specifiers_str = ['raw'];
  const specifiers_nostr = ['component'];
  const siteLinksLoaded = await Promise.all(
    siteLinks.map(async (l) => {
      if (l.img_import) {
        try {
          const [prefix, img_import1] = l.img_import.includes(':')
            ? l.img_import.split(':', 2)
            : ['', l.img_import];
          const [img_import, specifier1] = img_import1.includes('?')
            ? l.img_import.split('?', 2)
            : [l.img_import, ''];
          const specifier = specifier1.toLowerCase();
          const extension = getExtension(img_import);

          let stringOk = false;
          if (specifiers_nostr.includes(specifier) || exts_nostr.includes(extension)) {
            stringOk = false;
          } else if (specifiers_str.includes(specifier) || exts_str.includes(extension)) {
            stringOk = true;
          }

          let pathname = getComponentPath(img_import, callerPath);
          if (prefix) {
            // pathname = prefix + ':' + pathname; // restore prefix that getComponentPath() does not preserve.
          }
          if (specifier) {
            pathname = pathname + '?' + specifier; // restore specifier that getComponentPath() does not preserve.
          }
          const im: Component = (await import(/* @vite-ignore */ pathname)).default;
          if (!im || (!stringOk && typeof im === 'string')) {
            // Unfortunately, we can't currently import SVG files as components in runtime.
            // Perhaps we can do `svelte.compile()` here? Or need a plugin that compiles dynamic SVG into component in build time based on dynamic import.
            throw new Error(`Expected Component, got ${typeof im} from ${pathname}`);
          }
          return { ...l, imp: im };
        } catch (e) {
          console.log(`Error "${e}" loading module "${l.img_import}"`);
        }
      }
      return l;
    })
  );
  return siteLinksLoaded;
}
