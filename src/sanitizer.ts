import {
  INVISIBLE_CODEPOINTS,
  ANOMALOUS_WHITESPACE,
  HOMOGLYPHS_MAP,
  isUnicodeTag,
  isVariationSelector,
  isNonPrintableControl,
  normalizeFullwidth,
  normalizeMathAlphanumeric
} from './constants.js';
import { detectWatermarks } from './detector.js';
import { SanitizeOptions, SanitizeResult } from './types.js';

export const DEFAULT_SANITIZE_OPTIONS: Required<SanitizeOptions> = {
  normalizeSpaces: true,
  stripZeroWidth: true,
  stripTags: true,
  stripDirectional: true,
  stripVariationSelectors: true,
  stripControlChars: true,
  normalizeHomoglyphs: false,
  asciiOnly: false,
  normalizeNewlines: true,
  trimStegoTrailingWhitespace: true,
  unicodeNormalization: 'NFC'
};

/**
 * transliterate latin accented/diacritic chars to base ascii (such as: é -> e, ñ -> n, ü -> u).
 */
export function transliterateAccentsToAscii(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * recreate normal text completely from scratch, removing watermarks, steganography, unwqanted chars, and anomalous bytes. 
 */
export function sanitizeText(text: string, options: SanitizeOptions = {}): SanitizeResult {
  const opts: Required<SanitizeOptions> = { ...DEFAULT_SANITIZE_OPTIONS, ...options };
  const detection = detectWatermarks(text);

  const cleanChars: string[] = [];

  // recreate character by character
  for (const char of text) {
    const codePoint = char.codePointAt(0)!;
    if (opts.stripTags && isUnicodeTag(codePoint)) {
      continue;
    }
    if (INVISIBLE_CODEPOINTS.has(codePoint)) {
      const meta = INVISIBLE_CODEPOINTS.get(codePoint)!;
      if (opts.stripZeroWidth && meta.category === 'zero_width') {
        continue;
      }
      if (opts.stripDirectional && meta.category === 'directional') {
        continue;
      }
    }
    if (opts.stripVariationSelectors && isVariationSelector(codePoint)) {
      continue;
    }
    if (opts.stripControlChars && isNonPrintableControl(codePoint)) {
      continue;
    }
    if (opts.normalizeSpaces && ANOMALOUS_WHITESPACE.has(codePoint)) {
      const meta = ANOMALOUS_WHITESPACE.get(codePoint)!;
      cleanChars.push(meta.suggestedReplacement || ' ');
      continue;
    }
    const fullwidth = normalizeFullwidth(codePoint);
    if (fullwidth !== null && (opts.normalizeHomoglyphs || opts.asciiOnly)) {
      cleanChars.push(fullwidth);
      continue;
    }
    const mathLatin = normalizeMathAlphanumeric(codePoint);
    if (mathLatin !== null && (opts.normalizeHomoglyphs || opts.asciiOnly)) {
      cleanChars.push(mathLatin);
      continue;
    }
    if (opts.normalizeHomoglyphs || opts.asciiOnly) {
      const homoglyphEntry = HOMOGLYPHS_MAP.get(char);
      if (homoglyphEntry) {
        cleanChars.push(homoglyphEntry.latin);
        continue;
      }
    }
    
    cleanChars.push(char);
  }

  let reconstructed = cleanChars.join('');

  if (opts.normalizeNewlines) {
    reconstructed = reconstructed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }
  if (opts.trimStegoTrailingWhitespace) {
    reconstructed = reconstructed
      .split('\n')
      .map(line => line.replace(/[ \t]+$/, ''))
      .join('\n');
  }
  if (opts.asciiOnly) {
    reconstructed = transliterateAccentsToAscii(reconstructed);
    // replace any remaining non-ascii cahrs w/ safe approxims or omit
    reconstructed = reconstructed.replace(/[^\x00-\x7F]/g, '');
  }
  if (opts.unicodeNormalization !== 'none' && !opts.asciiOnly) {
    reconstructed = reconstructed.normalize(opts.unicodeNormalization);
  }

  const bytesOriginal = Buffer.byteLength(text, 'utf8');
  const bytesClean = Buffer.byteLength(reconstructed, 'utf8');

  return {
    original: text,
    cleanText: reconstructed,
    changed: text !== reconstructed,
    detection,
    bytesOriginal,
    bytesClean,
    bytesSaved: Math.max(0, bytesOriginal - bytesClean)
  };
}
