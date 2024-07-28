// Attention! Do not move this file away from website.js, websiteAsync.js, websiteFnc.js files. It must remain in the same directory, so getComponentPath() works properly
import { type Component } from 'svelte';
import type { SiteLink, SiteLinkFlatGroup, SiteLinkGroup } from '$lib/types';

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
  siteLinks: (SiteLink | SiteLinkGroup | SiteLinkFlatGroup)[],
  callerPath: string
): Promise<typeof siteLinks> {
  const exts_str = ['svg'];
  const exts_nostr = ['svelte'];
  const specifiers_str = ['raw'];
  const specifiers_nostr = ['component'];
  const siteLinksLoaded = await Promise.all(
    siteLinks.map(async (l) => {
      const l1: SiteLinkGroup = { ...l };
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
            l1.img_html = im;
          } else {
            l1.img_component = im;
          }
        } catch (e) {
          console.log(`Error "${e}" loading module "${l.img_import}"`);
        }
      }
      if (l.img_icon) {
        if (typeof l.img_icon === 'string') {
          // Also conveniently accept `path`, `svg`, or `svgUrl` as `data`
          const dataStr = l.img_icon.toLowerCase();
          if (dataStr.includes('<svg')) {
            l1.img_html = l.img_icon;
          } else if (dataStr.includes('http')) {
            l1.img_src = l.img_icon;
          } else {
            const path = l.img_icon;
            const html = pathsToSvg([path]);
            l1.img_html = html;
          }
        }
      }
      if ('items' in l && Array.isArray(l.items)) {
        l1.items = await getSiteLinksComponents(l.items, callerPath);
      }
      return l1;
    })
  );
  return siteLinksLoaded;
}

function pathsToSvg(paths: string[]): string {
  const size: string | number = '1.5em';
  const width = size;
  const height = size;

  const viewBox = '0 0 24 24'; // Need something to size it
  let html = `<svg width="${width}" height="${height}" viewBox="${viewBox}" role="presentation">`;
  paths.forEach((d) => {
    // html += `<path fill-rule="evenodd" clip-rule="evenodd" stroke="none" d="${d}" fill="currentColor"></path>`;
    html += `<path d="${d}" fill="currentColor"></path>`;
  });
  html += `</svg>`;

  return html;
}

// TODO: (now) This function badly needs UNIT TESTS for all kinds of arg combinations and siteLinks structures.
export function getSiteLinksFiltered(
  siteLinks: (SiteLink | SiteLinkGroup | SiteLinkFlatGroup)[],
  filter: 'header' | 'footer' | 'actions' | 'sidebar',
  treeDepth: number = 0, // 0 - will keep all depth branches, non-0 will prune the tree to the depth
  nodeFilter: boolean = true, // true will filter out nodes based on filter only (igmoring if any children match the filter), false will keep nodes that have children matching the filter
  flatten: boolean = false
): typeof siteLinks {
  // const filterField = ('displayIn' + filter[0].toUpperCase() + filter.slice(1)) as keyof (SiteLink | SiteLinkGroup | SiteLinkFlatGroup) ;
  const filterField = {
    header: 'displayInHeader',
    footer: 'displayInFooter',
    actions: 'displayInActions',
    sidebar: 'displayInSidebar'
  }?.[filter] as keyof (SiteLink | SiteLinkGroup | SiteLinkFlatGroup);
  if (!filterField) {
    return [];
  }

  function filterRecursively(
    elements: (SiteLink | SiteLinkGroup | SiteLinkFlatGroup)[],
    currentDepth: number
  ): typeof elements {
    if (treeDepth !== 0 && currentDepth >= treeDepth) {
      return [];
    }

    let result: (SiteLink | SiteLinkGroup | SiteLinkFlatGroup)[] = [];

    for (const element of elements) {
      const elem_filter_match = element[filterField];
      const filteredChildren: (SiteLink | SiteLinkGroup | SiteLinkFlatGroup)[] =
        (elem_filter_match || !nodeFilter) && 'items' in element && element?.items
          ? filterRecursively(element.items, currentDepth + 1)
          : [];

      const filteredElement: SiteLinkGroup | SiteLinkFlatGroup = { ...element };
      if (elem_filter_match || (!nodeFilter && filteredChildren.length > 0)) {
        if (flatten) {
          delete filteredElement.items;
          result.push(filteredElement);
          result = result.concat(filteredChildren);
        } else {
          if (filteredChildren.length > 0) {
            filteredElement.items = filteredChildren;
          } else {
            delete filteredElement.items;
          }
          result.push(filteredElement);
        }
      }
    }

    return result;
  }

  return filterRecursively(siteLinks, 0);
}
