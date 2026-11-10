import { getCollection } from 'astro:content';

// One Person entry per landman, for the structured data on every page. Each has a stable @id
// on the About page, where their full bios are, and points back to the business entry.
// Credentials come from each person's own list, so someone added without a CPL is never
// described to search engines as holding one.
const personName = (full: string) => {
  const m = full.match(/^(.*?),\s*(CPL|RPL|RL)$/);
  return m ? { name: m[1], honorificSuffix: m[2] } : { name: full };
};

export async function personNodes(site: URL, orgName: string) {
  let people: Awaited<ReturnType<typeof getCollection<'people'>>> = [];
  try {
    people = await getCollection('people');
  } catch {
    people = [];
  }
  const orgId = new URL('/#org', site).toString();
  return [...people]
    .sort((a, b) => (a.data.sort_order ?? 0) - (b.data.sort_order ?? 0))
    .map((person) => ({
      '@type': 'Person',
      '@id': new URL(`/about#${person.id}`, site).toString(),
      // The credential goes in honorificSuffix, so search engines read the name as a name.
      ...personName(person.data.name),
      url: new URL('/about', site).toString(),
      ...(person.data.role ? { jobTitle: person.data.role } : {}),
      ...(person.data.credentials.length > 0
        ? {
            hasCredential: person.data.credentials.map((c) => ({
              '@type': 'EducationalOccupationalCredential',
              credentialCategory: 'professional certification',
              name: c.name,
              ...(c.issuer ? { recognizedBy: { '@type': 'Organization', name: c.issuer } } : {}),
            })),
          }
        : {}),
      worksFor: { '@id': orgId, name: orgName },
      ...(person.data.photo ? { image: new URL(person.data.photo, site).toString() } : {}),
      ...(person.data.linkedin_url ? { sameAs: [person.data.linkedin_url] } : {}),
    }));
}
