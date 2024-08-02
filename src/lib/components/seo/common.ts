import type { ImageResource } from '$lib/types';
interface OpenGraphPropsBase {
  image: ImageResource;
  squareImage: ImageResource;
  metadescription: string;
  ogLanguage: string;
  pageTitle: string;
  siteTitle: string;
  url: string;
}
interface OpenGraphArticleProps extends OpenGraphPropsBase {
  article: true;
  datePublished: string;
  lastUpdated: string;
  facebookAuthorPage: string;
  facebookPage: string;
}
interface OpenGraphNonArticleProps extends OpenGraphPropsBase {
  article?: false;
}

export type OpenGraphProps = OpenGraphArticleProps | OpenGraphNonArticleProps;
