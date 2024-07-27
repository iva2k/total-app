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

// All paths with *.svelte components that need to be loaded dynamically by loadComponent(), e.g. in `website.siteLinks`
const componentPaths: ComponentMap[] = [
  import.meta.glob('../images/*.svelte') as ComponentMap,
  import.meta.glob('../images/*.svg', { as: 'raw' }) as ComponentMap
  // import.meta.glob('../assets/home/*.svelte') as ComponentMap,
  // Add more paths here as needed, inside `import.meta.glob(...) as ComponentMap`
];

type ComponentModule = () => Promise<{ default: Component }>;
type RawModule = () => Promise<string>;
interface ComponentMap {
  [key: string]: ComponentModule | RawModule;
}

// Static `components` is necessary for the dynamic import to work. It tells the bundler to
// include in the bundle all the components found in `components`.
// Create a merged component map from all paths
const components: ComponentMap = componentPaths.reduce((acc, map) => {
  const modules = map;
  return { ...acc, ...modules };
}, {});

export async function loadComponent(componentPath: string): Promise<Component | string | null> {
  // const componentPath = `../images/${name}.svelte`;
  if (components[componentPath]) {
    const module = await components[componentPath]();
    return typeof module === 'string' ? module : module.default;
  }
  // throw new Error(`Component ${name} not found`);
  // throw new Error(`Component ${componentPath} not found`);
  console.error(`Component ${componentPath} not found`);
  return null;
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

          // What type of import data to expect?
          let stringOk = false;
          if (specifiers_nostr.includes(specifier) || exts_nostr.includes(extension)) {
            stringOk = false;
          } else if (specifiers_str.includes(specifier) || exts_str.includes(extension)) {
            stringOk = true;
          }

          const im = await loadComponent(img_import);
          if (!im) {
            throw new Error(`Component ${img_import} not found`);
          }
          if (typeof im === 'string') {
            // string type can be returned for svg files - either ?raw - then it's file contents, or url.
            // There's no easy way to distinguish contents from url here, so decided to not handle urls here.
            if (!stringOk) {
              // Unfortunately, we can't currently import SVG files as components in runtime.
              // Perhaps we can do `svelte.compile()` here? Or need a plugin that compiles dynamic SVG into component in build time based on dynamic import.
              // throw new Error(`Expected Component, got ${typeof im} from ${pathname}`);
              throw new Error(`Expected Component, got ${typeof im} from ${img_import}`);
            }
            return { ...l, img_html: im };
          }
          return { ...l, img_component: im };
        } catch (e) {
          console.log(`Error "${e}" loading module "${l.img_import}"`);
        }
      }
      return l;
    })
  );
  return siteLinksLoaded;
}
