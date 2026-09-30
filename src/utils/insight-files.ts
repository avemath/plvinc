import fs from 'node:fs';
import path from 'node:path';

// Insights stays dormant until the first article is written. Asking Astro for an empty
// collection makes it print a warning for every page it builds, so the site checks for
// article files first and only reads the collection once there is something in it.
// The build always runs from the project folder, so the path is taken from there.
const INSIGHTS_DIR = path.join(process.cwd(), 'src/content/insights');

export function hasInsightFiles(): boolean {
  try {
    return fs.readdirSync(INSIGHTS_DIR).some((f) => f.endsWith('.md'));
  } catch {
    return false;
  }
}
