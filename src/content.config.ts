import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { hasInsightFiles } from './utils/insight-files';

// The editor saves an optional field that was cleared as null (a number) or an empty string
// (text). Either must build, or one cleared box would stop every deploy after it. Optional
// fields here therefore accept null as well as a missing key, and a cleared order number
// counts as 0.
const optionalText = z.string().nullish();
const orderNumber = z.number().nullish().transform((v) => v ?? 0);

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    card_description: z.string(),
    // Optional so a newly added service still builds; the page falls back to its title
    // and card description until these are filled in.
    seo_title: optionalText,
    seo_description: optionalText,
    icon: optionalText,
    sort_order: orderNumber,
    // Off unless a service actually has a sample to point at, so the callout
    // never appears on a page it does not belong on.
    show_sample_link: z.boolean().nullish().transform((v) => v ?? false),
    // Optional per-service closing CTA. Empty falls back to the shared one on
    // the Services page, so a new service still ends on a call to action.
    cta_headline: optionalText,
    cta_text: optionalText,
    // Where this page's closing button goes: most service visitors are companies, so the
    // project form; a page written for owners can send them to the landowner note.
    cta_link: z.enum(['/contact#project', '/contact#note', '/contact']).nullish().transform((v) => v ?? '/contact#project'),
    // Shows a short "own land or minerals? start here" note linking to the owners page.
    show_owner_note: z.boolean().nullish().transform((v) => v ?? false),
    cta_button: optionalText,
  }),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: z.object({
    name: z.string(),
    role: optionalText,
    photo: optionalText,
    sort_order: orderNumber,
    linkedin_url: optionalText,
    experience_details: optionalText,
    // Each person's own licences and designations. They show on the person's card and are
    // what tells search engines this person holds them, so nobody is described as a CPL
    // unless their own entry says so. The CMS saves a blank year or number as an empty
    // string or a number, so both are accepted and turned into text.
    credentials: z
      .array(
        z.object({
          name: z.string(),
          issuer: optionalText,
          year: z.union([z.string(), z.number()]).nullish().transform((v) => (v == null ? '' : String(v))),
          number: z.union([z.string(), z.number()]).nullish().transform((v) => (v == null ? '' : String(v))),
        })
      )
      .nullish()
      .transform((v) => v ?? []),
  }),
});

// Dormant by design. With no files in the folder the index redirects, no detail pages are
// generated, and the nav link is not rendered, exactly as the people collection behaves.
const insights = defineCollection({
  // With no articles yet, an empty loader stands in so the build does not warn that the
  // folder has nothing in it. Writing the first article switches the real one on.
  loader: hasInsightFiles()
    ? glob({ pattern: '**/*.md', base: './src/content/insights' })
    : { name: 'insights-none-yet', load: async () => {} },
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    image: optionalText,
  }),
});

export const collections = { services, people, insights };
