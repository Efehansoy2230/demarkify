import { WatermarkCategory } from './types.js';

export interface CharMetadata {
  codePoint: number;
  category: WatermarkCategory;
  name: string;
  description?: string;
  suggestedReplacement?: string;
}

export const INVISIBLE_CODEPOINTS: ReadonlyMap<number, CharMetadata> = new Map([

  [0x200B, { codePoint: 0x200B, category: 'zero_width', name: 'ZERO WIDTH SPACE', description: 'hidden space usually used to encode binary bits' }],
  [0x200C, { codePoint: 0x200C, category: 'zero_width', name: 'ZERO WIDTH NON-JOINER', description: 'invisible formatting char used in steganography' }],
  [0x200D, { codePoint: 0x200D, category: 'zero_width', name: 'ZERO WIDTH JOINER', description: 'invisible joiner used in emoji comp and ai watermarking' }],
  [0x2060, { codePoint: 0x2060, category: 'zero_width', name: 'WORD JOINER', description: 'zerowidth no break character' }],
  [0xFEFF, { codePoint: 0xFEFF, category: 'zero_width', name: 'ZERO WIDTH NO-BREAK SPACE (BOM)', description: 'byte order mark/invisible zerowidth space' }],
  [0x00AD, { codePoint: 0x00AD, category: 'zero_width', name: 'SOFT HYPHEN', description: 'invisible discretionary hyphen frequently abused for watermarks' }],
  [0x034F, { codePoint: 0x034F, category: 'zero_width', name: 'COMBINING GRAPHEME JOINER', description: 'invisible combining character' }],
  [0x061C, { codePoint: 0x061C, category: 'directional', name: 'ARABIC LETTER MARK', description: 'invisible directional formatting marker' }],
  [0x180E, { codePoint: 0x180E, category: 'zero_width', name: 'MONGOLIAN VOWEL SEPARATOR', description: 'invisible whitespace character' }],
  [0x2061, { codePoint: 0x2061, category: 'zero_width', name: 'FUNCTION APPLICATION', description: 'invisible mathematical operator' }],
  [0x2062, { codePoint: 0x2062, category: 'zero_width', name: 'INVISIBLE TIMES', description: 'invisible mathematical multiplication operator' }],
  [0x2063, { codePoint: 0x2063, category: 'zero_width', name: 'INVISIBLE SEPARATOR', description: 'invisible mathematical separator' }],
  [0x2064, { codePoint: 0x2064, category: 'zero_width', name: 'INVISIBLE PLUS', description: 'invisible mathematical plus operator' }],
  [0x17B4, { codePoint: 0x17B4, category: 'zero_width', name: 'KHMER VOWEL INHERENT AQ', description: 'invisible inherent vowel' }],
  [0x17B5, { codePoint: 0x17B5, category: 'zero_width', name: 'KHMER VOWEL INHERENT AA', description: 'invisible inherent vowel' }],
  [0xFFF9, { codePoint: 0xFFF9, category: 'zero_width', name: 'INTERLINEAR ANNOTATION ANCHOR', description: 'invisible ruby annotation delimiter' }],
  [0xFFFA, { codePoint: 0xFFFA, category: 'zero_width', name: 'INTERLINEAR ANNOTATION SEPARATOR', description: 'invisible ruby annotation delimiter' }],
  [0xFFFB, { codePoint: 0xFFFB, category: 'zero_width', name: 'INTERLINEAR ANNOTATION TERMINATOR', description: 'invisible ruby annotation delimiter' }],
  [0xFFFC, { codePoint: 0xFFFC, category: 'zero_width', name: 'OBJECT REPLACEMENT CHARACTER', description: 'embedded object placeholder' }],

  // hangul fillers (frequently used as invisible spaces / characters)
  [0x115F, { codePoint: 0x115F, category: 'zero_width', name: 'HANGUL CHOSEONG FILLER', description: 'invisible hangul choseong filler character' }],
  [0x1160, { codePoint: 0x1160, category: 'zero_width', name: 'HANGUL JUNGSEONG FILLER', description: 'invisible hangul jungseong filler character' }],
  [0x3164, { codePoint: 0x3164, category: 'zero_width', name: 'HANGUL FILLER', description: 'invisible hangul filler space frequently abused in steganography' }],
  [0xFFA0, { codePoint: 0xFFA0, category: 'zero_width', name: 'HALFWIDTH HANGUL FILLER', description: 'invisible halfwidth hangul filler' }],

  // invisible marks & formatting controls
  [0x070F, { codePoint: 0x070F, category: 'zero_width', name: 'SYRIAC ABBREVIATION MARK', description: 'invisible syriac abbreviation mark' }],
  [0x08E2, { codePoint: 0x08E2, category: 'zero_width', name: 'ARABIC DISPUTED END OF AYAH', description: 'arabic formatting control character' }],
  [0x2065, { codePoint: 0x2065, category: 'zero_width', name: 'RESERVED INVISIBLE FORMATTING', description: 'unassigned invisible formatting character' }],

  // deprecated format characters (U+206A - U+206F)
  [0x206A, { codePoint: 0x206A, category: 'zero_width', name: 'INHIBIT SYMMETRIC SWAPPING', description: 'deprecated invisible formatting control' }],
  [0x206B, { codePoint: 0x206B, category: 'zero_width', name: 'ACTIVATE SYMMETRIC SWAPPING', description: 'deprecated invisible formatting control' }],
  [0x206C, { codePoint: 0x206C, category: 'zero_width', name: 'INHIBIT ARABIC FORM SHAPING', description: 'deprecated invisible formatting control' }],
  [0x206D, { codePoint: 0x206D, category: 'zero_width', name: 'ACTIVATE ARABIC FORM SHAPING', description: 'deprecated invisible formatting control' }],
  [0x206E, { codePoint: 0x206E, category: 'zero_width', name: 'NATIONAL DIGIT SHAPES', description: 'deprecated invisible formatting control' }],
  [0x206F, { codePoint: 0x206F, category: 'zero_width', name: 'NOMINAL DIGIT SHAPES', description: 'deprecated invisible formatting control' }],

  // shorthand format controls (U+1BCA0 - U+1BCA3)
  [0x1BCA0, { codePoint: 0x1BCA0, category: 'zero_width', name: 'SHORTHAND FORMAT LETTER OVERLAP', description: 'invisible shorthand format control' }],
  [0x1BCA1, { codePoint: 0x1BCA1, category: 'zero_width', name: 'SHORTHAND FORMAT CONTINUING OVERLAP', description: 'invisible shorthand format control' }],
  [0x1BCA2, { codePoint: 0x1BCA2, category: 'zero_width', name: 'SHORTHAND FORMAT DOWN STEP', description: 'invisible shorthand format control' }],
  [0x1BCA3, { codePoint: 0x1BCA3, category: 'zero_width', name: 'SHORTHAND FORMAT UP STEP', description: 'invisible shorthand format control' }],

  // musical invisible controls (U+1D173 - U+1D17A)
  [0x1D173, { codePoint: 0x1D173, category: 'zero_width', name: 'MUSICAL SYMBOL BEGIN BEAM', description: 'invisible musical control' }],
  [0x1D174, { codePoint: 0x1D174, category: 'zero_width', name: 'MUSICAL SYMBOL END BEAM', description: 'invisible musical control' }],
  [0x1D175, { codePoint: 0x1D175, category: 'zero_width', name: 'MUSICAL SYMBOL BEGIN TIE', description: 'invisible musical control' }],
  [0x1D176, { codePoint: 0x1D176, category: 'zero_width', name: 'MUSICAL SYMBOL END TIE', description: 'invisible musical control' }],
  [0x1D177, { codePoint: 0x1D177, category: 'zero_width', name: 'MUSICAL SYMBOL BEGIN SLUR', description: 'invisible musical control' }],
  [0x1D178, { codePoint: 0x1D178, category: 'zero_width', name: 'MUSICAL SYMBOL END SLUR', description: 'invisible musical control' }],
  [0x1D179, { codePoint: 0x1D179, category: 'zero_width', name: 'MUSICAL SYMBOL BEGIN PHRASE', description: 'invisible musical control' }],
  [0x1D17A, { codePoint: 0x1D17A, category: 'zero_width', name: 'MUSICAL SYMBOL END PHRASE', description: 'invisible musical control' }],

  // dir formatting (usually used to obscure or change text ordering n hide a payload)
  [0x200E, { codePoint: 0x200E, category: 'directional', name: 'LEFT-TO-RIGHT MARK' }],
  [0x200F, { codePoint: 0x200F, category: 'directional', name: 'RIGHT-TO-LEFT MARK' }],
  [0x202A, { codePoint: 0x202A, category: 'directional', name: 'LEFT-TO-RIGHT EMBEDDING' }],
  [0x202B, { codePoint: 0x202B, category: 'directional', name: 'RIGHT-TO-LEFT EMBEDDING' }],
  [0x202C, { codePoint: 0x202C, category: 'directional', name: 'POP DIRECTIONAL FORMATTING' }],
  [0x202D, { codePoint: 0x202D, category: 'directional', name: 'LEFT-TO-RIGHT OVERRIDE' }],
  [0x202E, { codePoint: 0x202E, category: 'directional', name: 'RIGHT-TO-LEFT OVERRIDE' }],
  [0x2066, { codePoint: 0x2066, category: 'directional', name: 'LEFT-TO-RIGHT ISOLATE' }],
  [0x2067, { codePoint: 0x2067, category: 'directional', name: 'RIGHT-TO-LEFT ISOLATE' }],
  [0x2068, { codePoint: 0x2068, category: 'directional', name: 'FIRST STRONG ISOLATE' }],
  [0x2069, { codePoint: 0x2069, category: 'directional', name: 'POP DIRECTIONAL ISOLATE' }]
]);

/**
 * whitespace codepoints (anomalous) which differs from regular ASCII space. -(0x20)
 */
export const ANOMALOUS_WHITESPACE: ReadonlyMap<number, CharMetadata> = new Map([
  [0x00A0, { codePoint: 0x00A0, category: 'anomalous_space', name: 'NO-BREAK SPACE', suggestedReplacement: ' ' }],
  [0x1680, { codePoint: 0x1680, category: 'anomalous_space', name: 'OGHAM SPACE MARK', suggestedReplacement: ' ' }],
  [0x2000, { codePoint: 0x2000, category: 'anomalous_space', name: 'EN QUAD', suggestedReplacement: ' ' }],
  [0x2001, { codePoint: 0x2001, category: 'anomalous_space', name: 'EM QUAD', suggestedReplacement: ' ' }],
  [0x2002, { codePoint: 0x2002, category: 'anomalous_space', name: 'EN SPACE', suggestedReplacement: ' ' }],
  [0x2003, { codePoint: 0x2003, category: 'anomalous_space', name: 'EM SPACE', suggestedReplacement: ' ' }],
  [0x2004, { codePoint: 0x2004, category: 'anomalous_space', name: 'THREE-PER-EM SPACE', suggestedReplacement: ' ' }],
  [0x2005, { codePoint: 0x2005, category: 'anomalous_space', name: 'FOUR-PER-EM SPACE', suggestedReplacement: ' ' }],
  [0x2006, { codePoint: 0x2006, category: 'anomalous_space', name: 'SIX-PER-EM SPACE', suggestedReplacement: ' ' }],
  [0x2007, { codePoint: 0x2007, category: 'anomalous_space', name: 'FIGURE SPACE', suggestedReplacement: ' ' }],
  [0x2008, { codePoint: 0x2008, category: 'anomalous_space', name: 'PUNCTUATION SPACE', suggestedReplacement: ' ' }],
  [0x2009, { codePoint: 0x2009, category: 'anomalous_space', name: 'THIN SPACE', suggestedReplacement: ' ' }],
  [0x200A, { codePoint: 0x200A, category: 'anomalous_space', name: 'HAIR SPACE', suggestedReplacement: ' ' }],
  [0x2028, { codePoint: 0x2028, category: 'anomalous_space', name: 'LINE SEPARATOR', suggestedReplacement: '\n' }],
  [0x2029, { codePoint: 0x2029, category: 'anomalous_space', name: 'PARAGRAPH SEPARATOR', suggestedReplacement: '\n\n' }],
  [0x202F, { codePoint: 0x202F, category: 'anomalous_space', name: 'NARROW NO-BREAK SPACE', suggestedReplacement: ' ' }],
  [0x205F, { codePoint: 0x205F, category: 'anomalous_space', name: 'MEDIUM MATHEMATICAL SPACE', suggestedReplacement: ' ' }],
  [0x3000, { codePoint: 0x3000, category: 'anomalous_space', name: 'IDEOGRAPHIC SPACE', suggestedReplacement: ' ' }],
  [0x0085, { codePoint: 0x0085, category: 'anomalous_space', name: 'NEXT LINE (NEL)', suggestedReplacement: '\n' }]
]);

/**
 * check if a codepoint is a unicode tag char (U+E0000 to U+E007F)
 */
export function isUnicodeTag(codePoint: number): boolean {
  return (codePoint >= 0xE0000 && codePoint <= 0xE007F);
}

/**
 * check if a codepoint is a variation selector (U+FE00 - U+FE0F, U+E0100 - U+E01EF, U+180B - U+180F).
 */
export function isVariationSelector(codePoint: number): boolean {
  return (
    (codePoint >= 0xFE00 && codePoint <= 0xFE0F) ||
    (codePoint >= 0xE0100 && codePoint <= 0xE01EF) ||
    (codePoint >= 0x180B && codePoint <= 0x180F)
  );
}

/**
 * checks if a codepoint is a non printable control char (but excluding \t 0x09, \n 0x0A, \r 0x0D.)
 */
export function isNonPrintableControl(codePoint: number): boolean {
  return (
    (codePoint >= 0x00 && codePoint <= 0x08) ||
    codePoint === 0x0B ||
    codePoint === 0x0C ||
    (codePoint >= 0x0E && codePoint <= 0x1F) ||
    (codePoint >= 0x7F && codePoint <= 0x9F)
  );
}

/**
 * homoglyphs map: chars from other scripts (cyrillic, greek, fullwidth, mathematics)
 * that visually mimic latin letters.
 */
export const HOMOGLYPHS_MAP: ReadonlyMap<string, { latin: string; script: string }> = new Map([
  // cyrillic lowercase
  ['а', { latin: 'a', script: 'Cyrillic' }],
  ['с', { latin: 'c', script: 'Cyrillic' }],
  ['е', { latin: 'e', script: 'Cyrillic' }],
  ['о', { latin: 'o', script: 'Cyrillic' }],
  ['р', { latin: 'p', script: 'Cyrillic' }],
  ['х', { latin: 'x', script: 'Cyrillic' }],
  ['у', { latin: 'y', script: 'Cyrillic' }],
  ['і', { latin: 'i', script: 'Cyrillic' }],
  ['ј', { latin: 'j', script: 'Cyrillic' }],
  ['ѕ', { latin: 's', script: 'Cyrillic' }],
  ['ԁ', { latin: 'd', script: 'Cyrillic' }],
  ['ԛ', { latin: 'q', script: 'Cyrillic' }],
  ['ԝ', { latin: 'w', script: 'Cyrillic' }],
  ['ԓ', { latin: 'l', script: 'Cyrillic' }],
  ['п', { latin: 'n', script: 'Cyrillic' }],

  // cyrillic uppercase
  ['А', { latin: 'A', script: 'Cyrillic' }],
  ['В', { latin: 'B', script: 'Cyrillic' }],
  ['С', { latin: 'C', script: 'Cyrillic' }],
  ['Е', { latin: 'E', script: 'Cyrillic' }],
  ['Н', { latin: 'H', script: 'Cyrillic' }],
  ['І', { latin: 'I', script: 'Cyrillic' }],
  ['Ј', { latin: 'J', script: 'Cyrillic' }],
  ['К', { latin: 'K', script: 'Cyrillic' }],
  ['М', { latin: 'M', script: 'Cyrillic' }],
  ['О', { latin: 'O', script: 'Cyrillic' }],
  ['Р', { latin: 'P', script: 'Cyrillic' }],
  ['Ѕ', { latin: 'S', script: 'Cyrillic' }],
  ['Т', { latin: 'T', script: 'Cyrillic' }],
  ['Х', { latin: 'X', script: 'Cyrillic' }],
  ['Ү', { latin: 'Y', script: 'Cyrillic' }],
  ['З', { latin: '3', script: 'Cyrillic' }],

  // greek lookalikes
  ['Α', { latin: 'A', script: 'Greek' }],
  ['Β', { latin: 'B', script: 'Greek' }],
  ['Ε', { latin: 'E', script: 'Greek' }],
  ['Ζ', { latin: 'Z', script: 'Greek' }],
  ['Η', { latin: 'H', script: 'Greek' }],
  ['Ι', { latin: 'I', script: 'Greek' }],
  ['Κ', { latin: 'K', script: 'Greek' }],
  ['Μ', { latin: 'M', script: 'Greek' }],
  ['Ν', { latin: 'N', script: 'Greek' }],
  ['Ο', { latin: 'O', script: 'Greek' }],
  ['Ρ', { latin: 'P', script: 'Greek' }],
  ['Τ', { latin: 'T', script: 'Greek' }],
  ['Υ', { latin: 'Y', script: 'Greek' }],
  ['Χ', { latin: 'X', script: 'Greek' }],
  ['ο', { latin: 'o', script: 'Greek' }],
  ['ν', { latin: 'v', script: 'Greek' }],
  ['ι', { latin: 'i', script: 'Greek' }],
  ['κ', { latin: 'k', script: 'Greek' }],
  ['ρ', { latin: 'p', script: 'Greek' }],
  ['τ', { latin: 't', script: 'Greek' }],
  ['υ', { latin: 'u', script: 'Greek' }],

  // smart quotes and other detectable typographic punctuation tricks
  ['\u2018', { latin: "'", script: 'General Punctuation' }], // l single quote
  ['\u2019', { latin: "'", script: 'General Punctuation' }], // r single quote
  ['\u201A', { latin: "'", script: 'General Punctuation' }], // single low-9 quote
  ['\u201B', { latin: "'", script: 'General Punctuation' }], // single high-reversed-9 quote
  ['\u201C', { latin: '"', script: 'General Punctuation' }], // l double quote
  ['\u201D', { latin: '"', script: 'General Punctuation' }], // r double quote
  ['\u201E', { latin: '"', script: 'General Punctuation' }], // double low-9 quote
  ['\u201F', { latin: '"', script: 'General Punctuation' }], // double high-reversed-9 quote
  ['\u2013', { latin: '-', script: 'General Punctuation' }], // en dash
  ['\u2014', { latin: '--', script: 'General Punctuation' }], // em dash
  ['\u2015', { latin: '--', script: 'General Punctuation' }], // horizontal bar
  ['\u2026', { latin: '...', script: 'General Punctuation' }], // ellipsis
  ['\u2032', { latin: "'", script: 'General Punctuation' }], // prime
  ['\u2033', { latin: '"', script: 'General Punctuation' }], // double prime
  ['\u2044', { latin: '/', script: 'General Punctuation' }], // fraction slash
  ['\u2215', { latin: '/', script: 'Mathematical Operators' }], // division slash
  ['\u2212', { latin: '-', script: 'Mathematical Operators' }], // minus sign
  ['\u00AB', { latin: '<<', script: 'Latin-1' }], // l guillemet
  ['\u00BB', { latin: '>>', script: 'Latin-1' }], // r guillemet
]);

/**
 * normalize fullwidth ascii chars (U+FF01 up to U+FF5E) to standard ASCII (0x21 to 0x7E)
 */
export function normalizeFullwidth(codePoint: number): string | null {
  if (codePoint >= 0xFF01 && codePoint <= 0xFF5E) {
    return String.fromCharCode(codePoint - 0xFEE0);
  }
  if (codePoint === 0x3000) {
    return ' ';
  }
  return null;
}

/**
 * normalize mathematical alpha symbols (U+1D400 to U+1D7FF) to standard ASCII characters.
 */
export function normalizeMathAlphanumeric(codePoint: number): string | null {
  // bold latin: U+1D400-U+1D419 -> A-Z, U+1D41A-U+1D433 -> a-z
  if (codePoint >= 0x1D400 && codePoint <= 0x1D419) return String.fromCharCode(65 + (codePoint - 0x1D400));
  if (codePoint >= 0x1D41A && codePoint <= 0x1D433) return String.fromCharCode(97 + (codePoint - 0x1D41A));

  // italic latin: U+1D434-U+1D44D -> A-Z, U+1D44E-U+1D467 -> a-z
  if (codePoint >= 0x1D434 && codePoint <= 0x1D44D) return String.fromCharCode(65 + (codePoint - 0x1D434));
  if (codePoint >= 0x1D44E && codePoint <= 0x1D467) return String.fromCharCode(97 + (codePoint - 0x1D44E));

  // bold italic latin: U+1D468-U+1D481 -> A-Z, U+1D482-U+1D49B -> a-z
  if (codePoint >= 0x1D468 && codePoint <= 0x1D481) return String.fromCharCode(65 + (codePoint - 0x1D468));
  if (codePoint >= 0x1D482 && codePoint <= 0x1D49B) return String.fromCharCode(97 + (codePoint - 0x1D482));

  // sans serif latin: U+1D5A0-U+1D5B9 -> A-Z, U+1D5BA-U+1D5D3 -> a-z
  if (codePoint >= 0x1D5A0 && codePoint <= 0x1D5B9) return String.fromCharCode(65 + (codePoint - 0x1D5A0));
  if (codePoint >= 0x1D5BA && codePoint <= 0x1D5D3) return String.fromCharCode(97 + (codePoint - 0x1D5BA));

  // sans serif bold latin: U+1D5D4-U+1D5ED -> A-Z, U+1D5EE-U+1D607 -> a-z
  if (codePoint >= 0x1D5D4 && codePoint <= 0x1D5ED) return String.fromCharCode(65 + (codePoint - 0x1D5D4));
  if (codePoint >= 0x1D5EE && codePoint <= 0x1D607) return String.fromCharCode(97 + (codePoint - 0x1D5EE));

  // sans serif italic latin: U+1D608-U+1D621 -> A-Z, U+1D622-U+1D63B -> a-z
  if (codePoint >= 0x1D608 && codePoint <= 0x1D621) return String.fromCharCode(65 + (codePoint - 0x1D608));
  if (codePoint >= 0x1D622 && codePoint <= 0x1D63B) return String.fromCharCode(97 + (codePoint - 0x1D622));

  // sans serif bold italic latin: U+1D63C-U+1D655 -> A-Z, U+1D656-U+1D66F -> a-z
  if (codePoint >= 0x1D63C && codePoint <= 0x1D655) return String.fromCharCode(65 + (codePoint - 0x1D63C));
  if (codePoint >= 0x1D656 && codePoint <= 0x1D66F) return String.fromCharCode(97 + (codePoint - 0x1D656));

  // fraktur: U+1D504-U+1D51D -> A-Z, U+1D51E-U+1D537 -> a-z
  if (codePoint >= 0x1D504 && codePoint <= 0x1D51D) return String.fromCharCode(65 + (codePoint - 0x1D504));
  if (codePoint >= 0x1D51E && codePoint <= 0x1D537) return String.fromCharCode(97 + (codePoint - 0x1D51E));

  // bold fraktur: U+1D56C-U+1D585 -> A-Z, U+1D586-U+1D59F -> a-z
  if (codePoint >= 0x1D56C && codePoint <= 0x1D585) return String.fromCharCode(65 + (codePoint - 0x1D56C));
  if (codePoint >= 0x1D586 && codePoint <= 0x1D59F) return String.fromCharCode(97 + (codePoint - 0x1D586));

  // double-struck (blackboard bold): U+1D538-U+1D551 -> A-Z, U+1D552-U+1D56B -> a-z
  if (codePoint >= 0x1D538 && codePoint <= 0x1D551) return String.fromCharCode(65 + (codePoint - 0x1D538));
  if (codePoint >= 0x1D552 && codePoint <= 0x1D56B) return String.fromCharCode(97 + (codePoint - 0x1D552));

  // monospace latin: U+1D670-U+1D689 -> A-Z, U+1D68A-U+1D6A3 -> a-z
  if (codePoint >= 0x1D670 && codePoint <= 0x1D689) return String.fromCharCode(65 + (codePoint - 0x1D670));
  if (codePoint >= 0x1D68A && codePoint <= 0x1D6A3) return String.fromCharCode(97 + (codePoint - 0x1D68A));

  // digits:
  // bold digits: U+1D7CE-U+1D7D7 (0-9)
  if (codePoint >= 0x1D7CE && codePoint <= 0x1D7D7) return String.fromCharCode(48 + (codePoint - 0x1D7CE));
  // double-struck digits: U+1D7D8-U+1D7E1 (0-9)
  if (codePoint >= 0x1D7D8 && codePoint <= 0x1D7E1) return String.fromCharCode(48 + (codePoint - 0x1D7D8));
  // sans-serif digits: U+1D7E2-U+1D7EB (0-9)
  if (codePoint >= 0x1D7E2 && codePoint <= 0x1D7EB) return String.fromCharCode(48 + (codePoint - 0x1D7E2));
  // sans-serif bold digits: U+1D7EC-U+1D7F5 (0-9)
  if (codePoint >= 0x1D7EC && codePoint <= 0x1D7F5) return String.fromCharCode(48 + (codePoint - 0x1D7EC));
  // monospace digits: U+1D7F6-U+1D7FF (0-9)
  if (codePoint >= 0x1D7F6 && codePoint <= 0x1D7FF) return String.fromCharCode(48 + (codePoint - 0x1D7F6));

  return null;
}
