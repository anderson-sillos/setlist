const TITLE_LOCALE = 'pt-BR';

function isLowercase(value: string): boolean {
  return value === value.toLocaleLowerCase(TITLE_LOCALE);
}

function isUppercase(value: string): boolean {
  return value === value.toLocaleUpperCase(TITLE_LOCALE);
}

function isClearlyStylized(value: string, letters: readonly string[]): boolean {
  // Preserve common acronym patterns and short all-caps names such as ABBA.
  if (/(?:\p{L}[/.]){1,}\p{L}/u.test(value)) return true;
  const firstLetter = letters[0];
  if (
    firstLetter &&
    letters.length > 1 &&
    isLowercase(firstLetter) &&
    letters.slice(1).every(isUppercase)
  ) {
    return true;
  }
  return (
    !/\s/u.test(value) && letters.length <= 4 && letters.every(isUppercase)
  );
}

/**
 * Preserves source casing unless the name is uniformly lower/uppercase (with
 * the initial letter ignored), avoiding changes to intentionally styled names.
 */
export function formatEnrichmentName(value: string): string {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  const letters = Array.from(
    normalized.matchAll(/\p{L}/gu),
    ([letter]) => letter,
  ).filter((letter) => !isLowercase(letter) || !isUppercase(letter));
  const remainingLetters = letters.slice(1);

  if (
    remainingLetters.length === 0 ||
    isClearlyStylized(normalized, letters) ||
    (!remainingLetters.every(isLowercase) &&
      !remainingLetters.every(isUppercase))
  ) {
    return normalized;
  }

  return normalized
    .toLocaleLowerCase(TITLE_LOCALE)
    .replace(/(^|[\s\p{Pd}])\p{L}/gu, (initial) =>
      initial.toLocaleUpperCase(TITLE_LOCALE),
    );
}
