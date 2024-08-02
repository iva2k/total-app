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

interface SchemaOrgPropsBase {
  article: boolean;
  author: string;
  breadcrumbs: { name: string; slug: string }[];
  datePublished: string;
  entity: string;
  lastUpdated: string;
  featuredImage: ImageResource;
  metadescription: string;
  siteLanguage: string;
  siteTitle: string;
  siteTitleAlt: string;
  siteUrl: string;
  title: string;
  url: string;
  facebookPage: string;
  githubPage: string;
  linkedinProfile: string;
  telegramUsername: string;
  tiktokUsername: string;
  twitterUsername: string;
  entityMeta?: {
    url: string;
    faviconWidth: number;
    faviconHeight: number;
    caption?: string;
  };
}
export type SchemaOrgProps = SchemaOrgPropsBase;
