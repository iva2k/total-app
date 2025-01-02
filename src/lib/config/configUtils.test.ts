import { describe, it, expect } from 'vitest';
import { prepSiteLinks } from './configUtils';
import type { SiteLinkAny, SiteLinkGroup, SiteLinkFilter } from '../types';

describe('prepSiteLinks', () => {
  const mockSiteLinks: SiteLinkAny[] = [
    {
      href: '/',
      title: 'Home',
      displayInHeader: true,
      displayInSidebar: true
    },
    {
      title: 'Products',
      displayInHeader: true,
      items: [
        { href: '/products/1', title: 'Product 1', displayInSidebar: true },
        { href: '/products/2', title: 'Product 2', displayInSidebar: true }
      ]
    },
    {
      href: '/about',
      title: 'About',
      displayInFooter: true
    },
    {
      href: '/contact',
      title: 'Contact',
      displayInFooter: true,
      displayInSidebar: true
    }
  ];

  it('should filter links based on the provided filter', () => {
    const result = prepSiteLinks(mockSiteLinks, 'header' as SiteLinkFilter);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Home');
    expect(result[1].title).toBe('Products');
  });

  it('should respect the treeDepth parameter', () => {
    const result: SiteLinkGroup[] = prepSiteLinks(mockSiteLinks, '*' as SiteLinkFilter, 1);
    expect(result).toHaveLength(4);
    expect(result[1].items).toBeUndefined();
  });

  it('should apply nodeFilter correctly', () => {
    const result: SiteLinkGroup[] = prepSiteLinks(
      mockSiteLinks,
      'sidebar' as SiteLinkFilter,
      0,
      false
    );
    expect(result).toHaveLength(3);
    expect(result[1].items).toHaveLength(2);
  });

  it('should flatten the structure when flatten is true', () => {
    const result = prepSiteLinks(mockSiteLinks, '*' as SiteLinkFilter, 0, true, true);
    expect(result).toHaveLength(6);
    expect(result.every((item) => !('items' in item))).toBe(true);
  });

  it('should prune links without href when flatten and prune are true', () => {
    const result = prepSiteLinks(mockSiteLinks, '*' as SiteLinkFilter, 0, true, true, true);
    expect(result).toHaveLength(5);
    expect(result.every((item) => 'href' in item)).toBe(true);
  });

  it('should return an empty array for invalid filter', () => {
    const result = prepSiteLinks(mockSiteLinks, 'invalid' as SiteLinkFilter);
    expect(result).toHaveLength(0);
  });

  it('should handle empty input array', () => {
    const result = prepSiteLinks([], '*' as SiteLinkFilter);
    expect(result).toHaveLength(0);
  });

  it('should preserve original structure when no filtering is applied', () => {
    const result = prepSiteLinks(mockSiteLinks, '*' as SiteLinkFilter);
    expect(result).toEqual(mockSiteLinks);
  });

  it('should flatten original structure when no filtering is applied', () => {
    const result = prepSiteLinks(mockSiteLinks, '*' as SiteLinkFilter, 2, true, true, true);
    const expected = [
      {
        displayInHeader: true,
        displayInSidebar: true,
        href: '/',
        title: 'Home'
      },
      {
        displayInSidebar: true,
        href: '/products/1',
        title: 'Product 1'
      },
      {
        displayInSidebar: true,
        href: '/products/2',
        title: 'Product 2'
      },
      {
        displayInFooter: true,
        href: '/about',
        title: 'About'
      },
      {
        displayInFooter: true,
        displayInSidebar: true,
        href: '/contact',
        title: 'Contact'
      }
    ];
    expect(result).toEqual(expected);
  });
});
