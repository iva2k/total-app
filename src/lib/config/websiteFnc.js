/** Use this file to get site-wide settings:
 * import websiteFnc from '$lib/config/websiteFnc.js';
 * import { env } from '$env/static/public';
 * const { author, ogLanguage, siteLanguage, siteTitle, siteTitleAlt } = websiteFnc(env);
 */

// Do not use this file in `vite.config.ts`, instead use "./websiteAsync.js".
// For regular modules, it is easier to use "./website.js".

import {
  mdiAccount,
  mdiAccountCircleOutline,
  mdiAccountOutline,
  mdiCog,
  mdiLogout,
  mdiLogin
} from '@mdi/js';

const websiteFnc = (
  /** @type {Record<string, string | undefined>} */
  env
) => {
  const { PUBLIC_SITE_URL, VERCEL, NETLIFY } = env ?? {};

  const entity = 'IVA2K';
  const author = 'iva2k';
  const ogLanguage = 'en_US';
  const siteLanguage = 'en-US';
  const siteTitle = 'Total App - SvelteKit template';
  const siteShortTitle = 'Total App';
  const appIdentifier = 'com.iva2k.total-app';
  const appIssuer = 'com.iva2k';
  const description = 'Total App - starter application template built with SvelteKit.';
  const themeColor = '#000000';
  const backgroundColor = '#ffffff';
  const contactEmail = 'iva2k@yahoo.com';
  const facebookPageName = 'iva2k';
  const facebookAuthorPageName = 'iva2k';
  const githubPage = 'iva2k';
  const linkedinProfile = 'iva2k';
  const telegramUsername = 'iva2k';
  const tiktokUsername = '@iva2k';
  const twitterUsername = 'iva2k';
  const twitterUserId = '1234567890';
  const wireUsername = '@iva2k';
  const discord = 'https://discord.gg/CnCM2EvSW8';
  const githubRepo = 'https://github.com/iva2k/total-app';
  const websiteUrlBase = 'https://total-app.vercel.app';
  const websiteUrlNetlify = 'https://total-app.netlify.app';
  const websiteUrlVercel = 'https://total-app.vercel.app';
  const websiteUrl = NETLIFY ? websiteUrlNetlify : VERCEL ? websiteUrlVercel : websiteUrlBase;

  const googleSiteVerificationNetlify = '';
  const googleSiteVerificationVercel = 'BXO06YUfaqiMbQ-FgBPqQAgWB7giDX-pLEDSz89vUng';

  /** @typedef {import('../types').SiteLink         } SiteLink          */ // Use for non-nests
  /** @typedef {import('../types').SiteLinkGroup    } SiteLinkGroup     */ // Use for deep-nested hierarchical
  /** @typedef {import('../types').SiteLinkFlatGroup} SiteLinkFlatGroup */ // Use for 1-level-nested hierarchical
  /** @type SiteLinkFlatGroup[] */
  const siteLinks = [
    {
      // Brand / Site icon and URL
      href: '/home',
      title: siteShortTitle,
      img_import: '../images/logo.svg',
      displayInBrand: true
    },
    {
      // href: '/',
      // prefix: 'visit',
      title: 'Demo App',
      // suffix: 'for live example',
      img_import: '../images/logo.svg',
      img_alt: '',
      // prettier-ignore
      items: [
        // { href: '/', title: 'Home' }, // '/' redirects to '/home'
        // See "Brand" item above for another `/home` route:
        { href: '/home'          , title: 'Home'            , displayInHeader: true, displayInSidebar: true },
        { href: '/about'         , title: 'About'           , displayInHeader: true, displayInSidebar: true },
        { href: '/sverdle'       , title: 'Sverdle'         , displayInHeader: true, displayInSidebar: true },
        { href: '/geolocation'   , title: 'Geolocation'     , displayInHeader: true, displayInSidebar: true },
        { href: '/qrscanner'     , title: 'QR Scanner'      , displayInHeader: true, displayInSidebar: true },
        { href: '/flowbite'      , title: 'Flowbite'        , displayInHeader: true, displayInSidebar: true },
      ],
      displayInHeader: true
    },
    {
      // href: '/auth',
      // prefix: 'visit',
      title: 'User',
      // suffix: 'for live example',
      // img_import: '../images/logo.svg',
      img_icon: mdiAccount,
      img_alt: '',
      // prettier-ignore
      items: [
        { href: '/setting'       , title: 'Settings'        , img_icon: mdiCog                  , /* img_import: 'mdiCog'                  ,*/ displayInUser: true },
        { href: '/auth'          , title: 'Account'         , img_icon: mdiAccountCircleOutline , /* img_import: 'mdiAccountCircleOutline' ,*/ displayInUser: true },
        { href: '/@auth:signout' , title: 'Log Out'         , img_icon: mdiLogout               , /* img_import: 'mdiLogout'               ,*/ displayInUser: true },
      ],
      displayInUser: true
    },
    {
      // href: '/auth',
      // prefix: 'visit',
      title: 'User',
      // suffix: 'for live example',
      // img_import: '../images/logo.svg',
      img_icon: mdiAccountOutline,
      img_alt: '',
      // prettier-ignore
      items: [
        { href: '/auth'          , title: 'Log In'          , img_icon: mdiLogin                , /* img_import: 'mdiLogin'                ,*/ displayInLogin: true },
      ],
      displayInLogin: true
    },
    {
      href: discord,
      target: '_blank',
      prefix: 'visit',
      title: 'Discord',
      suffix: 'for support',
      // img_import: '../images/discord.svelte',
      img_icon:
        'M20.33 5.06C18.78 4.33 17.12 3.8 15.38 3.5 15.17 3.89 14.92 4.4 14.74 4.82 12.9 4.54 11.07 4.54 9.26 4.82 9.09 4.4 8.83 3.89 8.62 3.5 6.88 3.8 5.21 4.33 3.66 5.06 0.53 9.79-0.32 14.41 0.1 18.96 2.18 20.52 4.19 21.46 6.17 22.08 6.66 21.4 7.1 20.69 7.48 19.93 6.76 19.66 6.07 19.33 5.43 18.94 5.6 18.81 5.77 18.68 5.93 18.54 9.88 20.39 14.17 20.39 18.07 18.54 18.23 18.68 18.4 18.81 18.57 18.94 17.92 19.33 17.24 19.66 16.52 19.94 16.9 20.69 17.33 21.41 17.82 22.08 19.8 21.46 21.82 20.52 23.9 18.96 24.4 13.69 23.05 9.11 20.33 5.06ZM8.01 16.17C6.83 16.17 5.86 15.06 5.86 13.71 5.86 12.36 6.81 11.25 8.01 11.25 9.22 11.25 10.19 12.36 10.17 13.71 10.17 15.06 9.22 16.17 8.01 16.17ZM15.99 16.17C14.8 16.17 13.83 15.06 13.83 13.71 13.83 12.36 14.78 11.25 15.99 11.25 17.19 11.25 18.17 12.36 18.14 13.71 18.14 15.06 17.19 16.17 15.99 16.17Z',
      img_alt: '',
      displayInActions: true,
      displayInFooter: true
    },
    {
      href: githubRepo,
      target: '_blank',
      prefix: 'visit',
      title: 'App GitHub Repo',
      suffix: 'for details',
      img_icon:
        'M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z',
      // img_import: '../images/github.svelte',
      img_alt: '',
      displayInActions: true,
      displayInFooter: true
    },
    {
      href: 'https://kit.svelte.dev',
      target: '_blank',
      prefix: 'visit',
      title: 'kit.svelte.dev',
      suffix: 'to learn SvelteKit',
      // img_import: '../images/svelte-logo.svelte', // Using wrapper component. Works.
      img_import: '../images/svelte-logo.svg', // Using SVG file directly. Works (with {@html item.img_import})
      // img_import: 'virtual:icons/images/svelte-logo', // Using unplugin-icons. Does not work (no run-time dynamic imports in unplugin-icons)
      img_alt: 'SvelteKit',
      displayInActions: true,
      displayInFooter: true
    }
  ];

  /** @type { Record<string, {redirect?: string; message?: string;}> } */
  const siteProtectedRoutes = {
    '/protected': { message: 'Please sign in to access this content.' }
  };

  const siteConfig = {
    // Various website configuration settings
    mustLoginAfterUserRegister: true
  };

  const website = {
    siteUrl: PUBLIC_SITE_URL,
    isNetlify: NETLIFY,
    isVercel: VERCEL,

    entity,
    author,
    ogLanguage,
    siteLanguage,
    siteTitle,
    siteShortTitle,
    appIdentifier,
    appIssuer,
    description,
    themeColor,
    backgroundColor,
    contactEmail,
    facebookAuthorPageName,
    facebookPageName,
    githubPage,
    linkedinProfile,
    telegramUsername,
    tiktokUsername,
    twitterUsername,
    twitterUserId,
    wireUsername,
    googleSiteVerificationNetlify,
    googleSiteVerificationVercel,
    githubRepo,
    websiteUrlBase,
    websiteUrl,
    siteLinks,
    siteProtectedRoutes,
    siteConfig
  };
  // console.log('DEBUG websiteFnc.js website=%o, env=%o', website, env);
  return website;
};
export { websiteFnc as default };
