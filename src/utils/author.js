const stripQuotesRegex = /["'`\u201c\u201d\u2018\u2019]/g;
const stripMidDotsRegex = /[\u00b7\u2022]/g;

export function normalizeAuthorKey(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(stripQuotesRegex, '')
    .replace(stripMidDotsRegex, '')
    .replace(/\s+/g, ' ')
    .trim();
}
