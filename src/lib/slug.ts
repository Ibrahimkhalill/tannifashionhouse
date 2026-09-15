const BANGLA_CHAR_RE = /[\u0980-\u09FF]/g;

export function slugifyText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKC")
    .replace(/[\u200c\u200d]/g, "")
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isFragmentedBanglaSlug(slug: string): boolean {
  const banglaChars = slug.match(BANGLA_CHAR_RE)?.length ?? 0;
  const hyphenCount = slug.match(/-/g)?.length ?? 0;
  return banglaChars >= 4 && hyphenCount >= Math.floor(banglaChars / 2);
}

export function normalizeProductSlug(slug: string, nameFallback: string): string {
  const fromSlug = slugifyText(slug);
  if (fromSlug && !isFragmentedBanglaSlug(fromSlug)) return fromSlug;
  return slugifyText(nameFallback) || fromSlug;
}

