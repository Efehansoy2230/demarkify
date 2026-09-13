import { describe, it, expect } from 'vitest';
import { sanitizeText, transliterateAccentsToAscii } from '../src/sanitizer.js';

describe('sanitizeText', () => {
  it('leaves clean text unaltered', () => {
    const text = 'clean text here!\nline two.\n';
    const result = sanitizeText(text);
    expect(result.changed).toBe(false);
    expect(result.cleanText).toBe(text);
    expect(result.bytesSaved).toBe(0);
  });

  it('remove zero width chars and invisible joiners', () => {
    const dirty = 'h\u200Be\u200Cl\u200Dl\uFEFFo\u2060 \u00ADworld!';
    const result = sanitizeText(dirty);
    expect(result.changed).toBe(true);
    expect(result.cleanText).toBe('hello world!');
    expect(result.bytesSaved).toBeGreaterThan(0);
  });

  it('remove unicode tag chars', () => {
    const dirty = 'Clean\u{E0001}\u{E0020}\u{E0041}\u{E0042}Text';
    const result = sanitizeText(dirty);
    expect(result.changed).toBe(true);
    expect(result.cleanText).toBe('CleanText');
  });

  it('normalize anomalous spaces to normal ascii space', () => {
    const dirty = 'word\u00A0word\u2003word\u202Fword\u3000word';
    const result = sanitizeText(dirty, { normalizeSpaces: true });
    expect(result.cleanText).toBe('word word word word word');
  });

  it('normalizes cyrillic and greek homoglyphs when requested', () => {
    // 'а' = cyrillic \u0430, 'е' = cyrillic \u0435, 'о' = cyrillic \u043E
    const dirty = 'h\u0435ll\u043E p\u0430ss';
    const result = sanitizeText(dirty, { normalizeHomoglyphs: true });
    expect(result.cleanText).toBe('hello pass');
  });

  it('transliterates to pure 7-bit ASCII in --ascii mode', () => {
    const dirty = '“café\u200B au lait” — voilà!';
    const result = sanitizeText(dirty, { asciiOnly: true });
    // smart quotes > straight quotes or ascii approx, zero w stripped, é -> e, à -> a, em dash -> --
    expect(result.cleanText).toBe('"cafe au lait" -- voila!');
    // verify clean ascii bytes
    for (let i = 0; i < result.cleanText.length; i++) {
      expect(result.cleanText.charCodeAt(i)).toBeLessThanOrEqual(127);
    }
  });

  it('remove steganographic trailing whitespace by default', () => {
    const dirty = 'Line one   \t   \nLine two \nLine three';
    const result = sanitizeText(dirty);
    expect(result.cleanText).toBe('Line one\nLine two\nLine three');
  });

  it('normalize CRLF to LF by default', () => {
    const dirty = 'Line 1\r\nLine 2\r\nLine 3';
    const result = sanitizeText(dirty);
    expect(result.cleanText).toBe('Line 1\nLine 2\nLine 3');
  });
});

describe('transliterateAccentsToAscii', () => {
  it('strips diacritics and accents correctly', () => {
    expect(transliterateAccentsToAscii('Crème brûlée')).toBe('Creme brulee');
    expect(transliterateAccentsToAscii('Señorita')).toBe('Senorita');
    expect(transliterateAccentsToAscii('Über')).toBe('Uber');
  });
});
