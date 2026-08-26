const ALLOWED_CHARACTER_PATTERN = /[ぁ-んゔー]/gu;

function katakanaToHiragana(character) {
  const codePoint = character.codePointAt(0);

  if (codePoint >= 0x30a1 && codePoint <= 0x30f6) {
    return String.fromCodePoint(codePoint - 0x60);
  }

  return character;
}

export function normalizeAnswerInput(value) {
  const normalized = String(value || "")
    .normalize("NFKC")
    .split("")
    .map(katakanaToHiragana)
    .join("");

  return normalized.match(ALLOWED_CHARACTER_PATTERN) || [];
}
