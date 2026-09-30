import { getCollection } from 'astro:content';

export interface LinkedInProfile {
  name: string;
  url: string;
}

// Everyone on the team who has a LinkedIn address filled in, in the same order as the
// About page. The Contact page and the footer both list these, so adding or removing a
// profile under Team / People updates every place at once.
export async function getLinkedInProfiles(): Promise<LinkedInProfile[]> {
  try {
    const people = await getCollection('people');
    return [...people]
      .sort((a, b) => (a.data.sort_order ?? 0) - (b.data.sort_order ?? 0))
      .filter((p) => p.data.linkedin_url?.trim())
      .map((p) => ({ name: p.data.name, url: p.data.linkedin_url!.trim() }));
  } catch {
    return [];
  }
}
