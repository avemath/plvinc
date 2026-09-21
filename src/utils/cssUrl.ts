// Wraps a CMS-supplied media path for use in an inline `url()`. Quotes are the
// only characters that can break out of the declaration, and an apostrophe in
// an uploaded filename is ordinary enough to guard against.
export function cssUrl(path: string): string {
  return `url('${path.replace(/'/g, '%27').replace(/"/g, '%22')}')`;
}
