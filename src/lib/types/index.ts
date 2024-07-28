export type ImageResource = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
};

export interface LayoutContext {
  get: () => { ssrPathname: string };
}

import { type Component } from 'svelte';
export interface SiteLink {
  href?: string;

  prefix?: string;
  title: string;
  suffix?: string;

  // Specify one of .img_icon, .img_src, .img_import to use an icon
  img_icon?: string; // Specify .img_icon that can be passed to Icon component (data prop). Can be SVG path.
  img_src?: string; // Specify .img_src for regular images -> <img src={item.img_src} ...>, Specify .img_import for *.svg and *.svelte
  img_alt?: string; // alt prop for <img> tag when using .img_src
  img_import?: string; // Component path to import. For *.svg files, result will be .img_html -> {@html item.img_html}. For *.svelte files, result will be .img_component -> <svelte: component this={item.img_component} />
  img_component?: Component;
  img_html?: string;

  displayInHeader?: boolean;
  displayInFooter?: boolean;
  displayInActions?: boolean;
  displayInSidebar?: boolean;
}

export interface SiteLinkFlatGroup extends SiteLink {
  items?: SiteLink[];
}
export interface SiteLinkGroup extends SiteLink {
  items?: (SiteLink | SiteLinkGroup)[];
}
