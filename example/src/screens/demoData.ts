import type { TabItem } from '@ramijd/parallax-header-tabs';

/** Shared by all three header screens — only the hero differs between them. */
export const THEME = {
  background: '#f4f5f7',
  surface: '#ffffff',
  text: '#6b7280',
  activeText: '#24595f',
  indicator: '#24595f',
  bannerBackground: 'rgba(17,24,39,0.92)',
};

export const INITIAL_TABS: TabItem[] = [
  { key: 'overview', title: 'Overview' },
  { key: 'population', title: 'Population' },
  { key: 'housing', title: 'Housing' },
  { key: 'medical', title: 'Medical' },
  { key: 'diet', title: 'Diet' },
  { key: 'taxonomy', title: 'Taxonomy' },
];

export const SUB_TABS: TabItem[] = [
  { key: 'pending', title: 'Pending' },
  { key: 'approved', title: 'Approved' },
];

export const GALLERY = [
  'https://picsum.photos/id/1074/900/600',
  'https://picsum.photos/id/1025/900/600',
  'https://picsum.photos/id/1062/900/600',
  'https://picsum.photos/id/1084/900/600',
];

/** One picture, to show a lone image is not drawn as a carousel. */
export const SOLO_IMAGE = ['https://picsum.photos/id/1074/900/600'];

/** Every image here is 900×600. */
export const GALLERY_RATIO = 3 / 2;
