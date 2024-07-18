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
