import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    card_description: z.string(),
    icon: z.string().optional(),
    sort_order: z.number().default(0),
  }),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    photo: z.string().optional(),
    sort_order: z.number().optional().default(0),
    experience_details: z.string().optional(),
  }),
});

export const collections = { services, people };
