/**
 * A description search can show in full (about 160 characters): the
 * leading sentences of a longer text, never cut mid-sentence.
 */
export function shortDescription(text: string, max = 160): string {
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > max) break;
    out += sentence;
  }
  return out.trim() || `${text.slice(0, max - 1).trimEnd()}…`;
}
