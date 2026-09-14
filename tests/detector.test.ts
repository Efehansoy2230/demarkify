import { describe, it, expect } from 'vitest';
import {
  detectWatermarks,
  decodeTagSteganography,
  decodeZeroWidthBinary,
  decodeWhitespaceBinary,
  detectHomoglyphs
} from '../src/detector.js';

describe('detectWatermarks', () => {
  it('identifies clean text', () => {
    const text = 'completely pure and legit text without watermarks.';
    const result = detectWatermarks(text);
    expect(result.clean).toBe(true);
    expect(result.totalWatermarks).toBe(0);
  });

  it('detects zero width space and invisible markers', () => {
    const text = 'hello\u200Bworld\u200Cwith\uFEFFBOM';
    const result = detectWatermarks(text);
    expect(result.clean).toBe(false);
    expect(result.categories.zero_width).toBe(3);
    expect(result.matches.some(m => m.hex === 'U+200B')).toBe(true);
    expect(result.matches.some(m => m.hex === 'U+200C')).toBe(true);
    expect(result.matches.some(m => m.hex === 'U+FEFF')).toBe(true);
  });

  it('detects directional override and isolate markers', () => {
    const text = 'normal\u202Ereversed\u202Ctext\u2066isolate\u2069';
    const result = detectWatermarks(text);
    expect(result.clean).toBe(false);
    expect(result.categories.directional).toBe(4);
  });

  it('detects anomalous whitespace characters', () => {
    const text = 'text\u00A0with\u2003em\u2009and\u202Fthin\u3000spaces';
    const result = detectWatermarks(text);
    expect(result.clean).toBe(false);
    expect(result.categories.anomalous_space).toBe(5);
  });

  it('detects non printable control characters', () => {
    const text = 'text with\x00null byte and\x07bell';
    const result = detectWatermarks(text);
    expect(result.clean).toBe(false);
    expect(result.categories.control_char).toBe(2);
  });

  it('detects hangul fillers, line separators, and formatting controls', () => {
    const text = 'text\u3164with\u2028line\u2029sep\u0085and\u206Acontrol';
    const result = detectWatermarks(text);
    expect(result.clean).toBe(false);
    expect(result.matches.some(m => m.hex === 'U+3164')).toBe(true);
    expect(result.matches.some(m => m.hex === 'U+2028')).toBe(true);
    expect(result.matches.some(m => m.hex === 'U+2029')).toBe(true);
    expect(result.matches.some(m => m.hex === 'U+0085')).toBe(true);
    expect(result.matches.some(m => m.hex === 'U+206A')).toBe(true);
  });
});

describe('steganography decoders', () => {
  it('decodes unicode tag steganography (chatgpt / other llm payload tracking)', () => {
    // encode "AI-WATERMARK" in unicode tags (0xE0000 + charCode)
    const secret = 'AI-WATERMARK';
    const tagChars = Array.from(secret)
      .map(ch => String.fromCodePoint(0xE0000 + ch.charCodeAt(0)))
      .join('');
    const fullText = `here is standard text${tagChars} that looks normal.`;

    const payloads = decodeTagSteganography(fullText);
    expect(payloads.length).toBe(1);
    expect(payloads[0].decodedText).toBe('AI-WATERMARK');
    expect(payloads[0].type).toBe('tag_stego');
  });

  it('decodes zero-width binary steganography', () => {
    // encode 'HI' in 8-bit binary using \u200B for 0 and \u200C for 1: 'H' = 72 = 01001000, 'I' = 73 = 01001001
    const bits = '0100100001001001';
    const zwSequence = Array.from(bits)
      .map(b => (b === '0' ? '\u200B' : '\u200C'))
      .join('');
    const fullText = `normal prompt${zwSequence} continuation`;

    const payloads = decodeZeroWidthBinary(fullText);
    expect(payloads.length).toBe(1);
    expect(payloads[0].decodedText).toBe('HI');
  });

  it('decodes trailing whitespace steganography (spaces & tabs)', () => {
    // 'OK' = 01001111 01001011: 'O' = 79 = 01001111, 'K' = 75 = 01001011
    const bits = '0100111101001011';
    const trailing = Array.from(bits)
      .map(b => (b === '0' ? ' ' : '\t'))
      .join('');
    const fullText = `line 1 with hidden bits${trailing}\nline 2 is normal.`;

    const payloads = decodeWhitespaceBinary(fullText);
    expect(payloads.length).toBe(1);
    expect(payloads[0].decodedText).toBe('OK');
  });
});

describe('detectHomoglyphs', () => {
  it('detects cyrillic lookalikes inside latin words', () => { // 'р' and 'а' are cyrillic U+0440 and U+0430
    const dirty = 'p\u0430ssword with cyrillic \u0440';
    const matches = detectHomoglyphs(dirty);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.some(m => m.char === '\u0430' && m.replacement === 'a')).toBe(true);
  });

  it('detects mathematical bold / monospace lookalikes', () => {
    // 𝐇 = U+1D407 (mathematical bold caps H)
    const dirty = '\u{1D407}ello world';
    const matches = detectHomoglyphs(dirty);
    expect(matches.length).toBe(1);
    expect(matches[0].replacement).toBe('H');
  });

  it('detects fullwidth ascii lookalikes', () => {
    // Ａ = U+FF21 (fullwidth latin caps A)
    const dirty = '\uFF21pple';
    const matches = detectHomoglyphs(dirty);
    expect(matches.length).toBe(1);
    expect(matches[0].replacement).toBe('A');
  });
});
