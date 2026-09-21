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
