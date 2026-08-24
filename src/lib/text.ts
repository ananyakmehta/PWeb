// Content-collection frontmatter fields (primaryDescription, section body,
// nerdNumbers) are plain single YAML scalar strings — there's no markup to carry
// paragraph breaks, so multi-paragraph copy marks them the same way markdown itself
// does: a blank line between paragraphs. This is the one shared place that convention
// is implemented, used everywhere multi-paragraph frontmatter text is rendered.
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
