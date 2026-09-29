import settings from '../data/settings.json';

// Small pieces of wording that appear on every page: the menu, the footer and the phone
// bar. They live in Site Settings so they can be reworded in the editor, and each one
// falls back to the wording below if its field is ever left blank, so a cleared field
// can never leave an empty link or button behind.

const NAV_DEFAULTS = {
  home: 'Home',
  about: 'About',
  services: 'Services',
  mineral_owners: 'Mineral Owners',
  experience: 'Experience',
  sample_work: 'Sample Work',
  insights: 'Insights',
  contact: 'Contact',
};

const FOOTER_DEFAULTS = {
  contact_heading: 'Contact',
  navigation_heading: 'Navigation',
  rights: 'All rights reserved.',
  privacy_link: 'Privacy',
};

const MOBILE_BAR_DEFAULTS = {
  call: 'Call',
  note: 'Send a note',
};

function withDefaults<T extends Record<string, string>>(defaults: T, given: unknown): T {
  const out = { ...defaults };
  if (given && typeof given === 'object') {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = (given as Record<string, unknown>)[key as string];
      if (typeof value === 'string' && value.trim()) out[key] = value.trim() as T[keyof T];
    }
  }
  return out;
}

const s = settings as Record<string, unknown>;

export const navLabels = withDefaults(NAV_DEFAULTS, s.nav_labels);
export const footerLabels = withDefaults(FOOTER_DEFAULTS, s.footer_labels);
export const mobileBarLabels = withDefaults(MOBILE_BAR_DEFAULTS, s.mobile_bar_labels);

// Every page in the menu, in menu order. The addresses are fixed; only the wording is
// editable, because a changed address would break every link to that page.
export const NAV_PAGES: { key: keyof typeof NAV_DEFAULTS; href: string }[] = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'services', href: '/services' },
  { key: 'mineral_owners', href: '/mineral-owners' },
  { key: 'experience', href: '/experience' },
  { key: 'sample_work', href: '/sample-work' },
  { key: 'insights', href: '/insights' },
  { key: 'contact', href: '/contact' },
];

// Fills a heading from the data file, falling back to the wording it has always had.
export function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
