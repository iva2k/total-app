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
export type SiteLink = {
  href: string;
  title: string;
  imp?: Component;
  img_import?: string;
  img_src?: string;
  img_alt?: string;
  prefix?: string;
  suffix?: string;
};
