import { getCollection } from 'astro:content';
import { hasInsightFiles } from './insight-files';

// Every published article, or an empty list while there are none (without the warning
// an empty collection would print).
export async function getInsights() {
  return hasInsightFiles() ? await getCollection('insights') : [];
}
