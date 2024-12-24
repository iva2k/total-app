// Attention! Do not move this file away from website.js, websiteAsync.js, websiteFnc.js files. It must remain in the same directory, so _getComponentPath() works properly
import { type Component } from 'svelte';
import type {
  SiteLinkAny,
  SiteLink,
  SiteLinkFlatGroup,
  SiteLinkGroup,
  SiteLinkFilter
} from '$lib/types';

function _getComponentPath(path: string, callerPath: string): string {
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

// All paths with *.svelte components that need to be loaded dynamically by loadComponentImport(), e.g. in `website.siteLinks`
const componentPaths: ComponentMap[] = [
  import.meta.glob('../images/*.svelte') as ComponentMap,
  import.meta.glob('../images/*.svg', { query: '?raw' }) as ComponentMap
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

export async function loadComponentImport(
  componentPath: string
): Promise<Component | string | null> {
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

// Typeguard functions
function _isSiteLink(link: SiteLinkAny): link is SiteLink {
  return (link as SiteLink)?.href !== undefined;
}
function _isSiteLinkGroup(link: SiteLinkAny): link is SiteLinkGroup {
  return (
    (link as SiteLinkGroup)?.items !== undefined && Array.isArray((link as SiteLinkGroup)?.items)
  );
}
function _isSiteLinkFlatGroup(link: SiteLinkAny): link is SiteLinkFlatGroup {
  const items = (link as SiteLinkGroup)?.items;
  return items !== undefined && Array.isArray(items);
}

function getSiteLinkGroupItems(link: SiteLink): undefined;
function getSiteLinkGroupItems(link: SiteLinkFlatGroup): SiteLink[] | undefined;
function getSiteLinkGroupItems(link: SiteLinkGroup): SiteLinkAny[] | undefined;
function getSiteLinkGroupItems(link: SiteLinkAny): SiteLinkAny[] | undefined {
  const items = (link as SiteLinkGroup)?.items;
  return items;
}

export async function getSiteLinkComponent(
  siteLink: SiteLink,
  callerPath: string
): Promise<SiteLink>;
export async function getSiteLinkComponent(
  siteLink: SiteLinkFlatGroup,
  callerPath: string
): Promise<SiteLinkFlatGroup>;
export async function getSiteLinkComponent(
  siteLink: SiteLinkGroup,
  callerPath: string
): Promise<SiteLinkGroup>;
export async function getSiteLinkComponent(
  siteLink: SiteLinkAny,
  callerPath: string
): Promise<typeof siteLink>;
export async function getSiteLinkComponent(
  siteLink: SiteLinkAny,
  callerPath: string
): Promise<SiteLinkAny> {
  if (siteLink.img_import) {
    // This implementation is extremely expensive, as it ends up with 2.8MB of @mdi/js bundled into root chunk.
    // Instead, use `img_icon = mdiCog` after `import { mdiCog } from '@mdi/js';` in websiteFnc.js siteLinks.
    // if (siteLink.img_import.startsWith('mdi')) {
    //   const img = (await import('@mdi/js'))?.[siteLink.img_import];
    //   if (typeof img === 'string') {
    //     siteLink.img_icon = img;
    //   }
    // } else {
    const exts_str = ['svg'];
    const exts_nostr = ['svelte'];
    const specifiers_str = ['raw'];
    const specifiers_nostr = ['component'];
    try {
      const [_prefix, img_import1] = siteLink.img_import.includes(':')
        ? siteLink.img_import.split(':', 2)
        : ['', siteLink.img_import];
      const [img_import, specifier1] = img_import1.includes('?')
        ? siteLink.img_import.split('?', 2)
        : [siteLink.img_import, ''];
      const specifier = specifier1.toLowerCase();
      const extension = getExtension(img_import);

      // What type of import data to expect?
      let stringOk = false;
      if (specifiers_nostr.includes(specifier) || exts_nostr.includes(extension)) {
        stringOk = false;
      } else if (specifiers_str.includes(specifier) || exts_str.includes(extension)) {
        stringOk = true;
      }

      const im = await loadComponentImport(img_import);
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
        siteLink.img_html = im;
      } else {
        siteLink.img_component = im;
      }
    } catch (e) {
      console.log(`Error "${e}" loading module "${siteLink.img_import}"`);
    }
    // }
  }
  if (siteLink.img_icon) {
    if (typeof siteLink.img_icon === 'string') {
      // Also conveniently accept `path`, `svg`, or `svgUrl` as `data`
      const dataStr = siteLink.img_icon.toLowerCase();
      if (dataStr.includes('<svg')) {
        siteLink.img_html = siteLink.img_icon;
      } else if (dataStr.includes('http')) {
        siteLink.img_src = siteLink.img_icon;
      } else {
        const path = siteLink.img_icon;
        const html = pathsToSvg([path]);
        siteLink.img_html = html;
      }
    }
  }
  const items = getSiteLinkGroupItems(siteLink);
  if (items && items.length > 0) {
    await Promise.all(items.map((item) => getSiteLinkComponent(item, callerPath)));
  }
  return siteLink;
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
export function prepSiteLinks(
  siteLinks: SiteLinkAny[],
  filter: SiteLinkFilter,
  treeDepth: number,
  nodeFilter?: boolean,
  flatten?: true,
  prune?: boolean
): SiteLink[];

export function prepSiteLinks(
  siteLinks: SiteLinkAny[],
  filter: SiteLinkFilter,
  treeDepth: 1,
  nodeFilter?: boolean,
  flatten?: false,
  prune?: boolean
): SiteLink[];

export function prepSiteLinks(
  siteLinks: SiteLink[],
  filter: SiteLinkFilter,
  treeDepth: number,
  nodeFilter?: boolean,
  flatten?: boolean,
  prune?: boolean
): SiteLink[];

export function prepSiteLinks(
  siteLinks: SiteLinkFlatGroup[] | SiteLinkGroup[],
  filter: SiteLinkFilter,
  treeDepth: 2,
  nodeFilter?: boolean,
  flatten?: boolean,
  prune?: boolean
): SiteLinkFlatGroup[];

export function prepSiteLinks(
  siteLinks: SiteLinkFlatGroup[],
  filter: SiteLinkFilter,
  treeDepth: number,
  nodeFilter?: boolean,
  flatten?: boolean,
  prune?: boolean
): SiteLinkFlatGroup[];

export function prepSiteLinks(
  siteLinks: SiteLinkGroup[],
  filter: SiteLinkFilter,
  treeDepth?: number,
  nodeFilter?: boolean,
  flatten?: boolean,
  prune?: boolean
): SiteLinkGroup[];

export function prepSiteLinks(
  siteLinks: SiteLinkAny[],
  filter: SiteLinkFilter,
  treeDepth: number = 0, // 0 - will keep all depth branches, non-0 will prune the tree to the depth
  nodeFilter: boolean = true, // true will filter out nodes based on filter only (igmoring if any children match the filter), false will keep nodes that have children matching the filter
  flatten: boolean = false,
  prune?: boolean
): SiteLinkAny[] {
  const filterField = {
    brand: 'displayInBrand',
    header: 'displayInHeader',
    footer: 'displayInFooter',
    actions: 'displayInActions',
    sidebar: 'displayInSidebar',
    user: 'displayInUser',
    login: 'displayInLogin'
  }?.[filter] as keyof SiteLinkAny;
  if (!filterField) {
    return [];
  }

  function filterRecursively(elements: SiteLinkAny[], currentDepth: number): typeof elements {
    if (treeDepth !== 0 && currentDepth >= treeDepth) {
      return [];
    }

    let result: typeof elements = [];

    for (const element of elements) {
      const elem_filter_match = element[filterField];
      const filteredChildren: SiteLinkAny[] =
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

  let result = filterRecursively(siteLinks, 0);
  result = flatten && prune ? pruneSiteLinks(result) : result;
  return result;
}

export function pruneSiteLinks(siteLinks: SiteLinkFlatGroup[]): SiteLinkFlatGroup[];
export function pruneSiteLinks(siteLinks: SiteLinkGroup[]): SiteLinkGroup[];
export function pruneSiteLinks(siteLinks: SiteLinkAny[]): SiteLinkAny[] {
  // TODO: (when needed) Implement pruning non-flatened SiteLinkGroup[]:
  const result = siteLinks.filter((l) => !!l?.href);
  return result;
}

export function loadSiteLinks(siteLinks: SiteLinkAny[], callerPath: string): Promise<SiteLink>[];
export function loadSiteLinks(siteLinks: SiteLinkAny[], callerPath: string): Promise<SiteLink>[];
export function loadSiteLinks(siteLinks: SiteLink[], callerPath: string): Promise<SiteLink>[];
export function loadSiteLinks(
  siteLinks: SiteLinkFlatGroup[] | SiteLinkGroup[],
  callerPath: string
): Promise<SiteLinkFlatGroup>[];
export function loadSiteLinks(
  siteLinks: SiteLinkFlatGroup[],
  callerPath: string
): Promise<SiteLinkFlatGroup>[];
export function loadSiteLinks(
  siteLinks: SiteLinkGroup[],
  callerPath: string
): Promise<SiteLinkGroup>[];
export function loadSiteLinks(
  siteLinks: SiteLinkAny[],
  callerPath: string
): Promise<SiteLink | SiteLinkFlatGroup | SiteLinkGroup>[] {
  const result = siteLinks.map((siteLink) => getSiteLinkComponent(siteLink, callerPath));
  return result;
}
