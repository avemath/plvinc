import { marked } from 'marked';

marked.use({ gfm: true, breaks: false });

export async function renderMarkdown(text: string | undefined | null): Promise<string> {
  if (!text) return '';
  return await marked.parse(text);
}
