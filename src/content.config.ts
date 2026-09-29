import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    card_description: z.string(),
    // Optional so a newly added service still builds; the page falls back to its title
    // and card description until these are filled in.
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    icon: z.string().optional(),
    sort_order: z.number().default(0),
    // Off unless a service actually has a sample to point at, so the callout
    // never appears on a page it does not belong on.
    show_sample_link: z.boolean().optional().default(false),
    // Optional per-service closing CTA. Empty falls back to the shared one on
    // the Services page, so a new service still ends on a call to action.
    cta_headline: z.string().optional(),
    cta_text: z.string().optional(),
    cta_button: z.string().optional(),
  }),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    photo: z.string().optional(),
    sort_order: z.number().optional().default(0),
    linkedin_url: z.string().optional(),
    experience_details: z.string().optional(),
    // Each person's own licences and designations. They show on the person's card and are
    // what tells search engines this person holds them, so nobody is described as a CPL
    // unless their own entry says so. The CMS saves a blank year or number as an empty
    // string or a number, so both are accepted and turned into text.
    credentials: z
      .array(
        z.object({
          name: z.string(),
          issuer: z.string().optional(),
          year: z.union([z.string(), z.number()]).optional().transform((v) => (v == null ? '' : String(v))),
          number: z.union([z.string(), z.number()]).optional().transform((v) => (v == null ? '' : String(v))),
        })
      )
      .optional()
      .default([]),
  }),
});

// Dormant by design. With no files in the folder the index redirects, no detail pages are
// generated, and the nav link is not rendered, exactly as the people collection behaves.
const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    image: z.string().optional(),
  }),
});

export const collections = { services, people, insights };
