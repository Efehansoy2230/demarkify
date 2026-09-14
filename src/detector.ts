import {
  INVISIBLE_CODEPOINTS,
  ANOMALOUS_WHITESPACE,
  HOMOGLYPHS_MAP,
  isUnicodeTag,
  isVariationSelector,
  isNonPrintableControl,
  isPrivateUse,
  isFormatControl,
  normalizeFullwidth,
  normalizeMathAlphanumeric
} from './constants.js';
import {
  WatermarkCategory,
  WatermarkMatch,
  HomoglyphMatch,
  DecodedPayload,
  DetectionResult
} from './types.js';

/**
 * calculate UTF-8 byte len of a string or char code point
 */
export function getUtf8ByteLength(str: string): number {
  return Buffer.byteLength(str, 'utf8');
}

/**
 * create humanlike context around specific index
 */
export function getContextSnippet(text: string, index: number, charRepr: string, radius: number = 15): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + 1 + radius);
  const before = text.slice(start, index).replace(/[\r\n]/g, ' ');
  const after = text.slice(index + 1, end).replace(/[\r\n]/g, ' ');
  return `${before}[${charRepr}]${after}`;
}

/**
 * try and decode unicode tag steganography (U+E0020 / U+E007E > ASCII 0x20 / 0x7E).
 */
export function decodeTagSteganography(text: string): DecodedPayload[] {
  const payloads: DecodedPayload[] = [];
  const regex = /[\u{E0020}-\u{E007E}]+/gu;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const decoded = Array.from(raw)
      .map(char => {
        const cp = char.codePointAt(0)!;
        return String.fromCharCode(cp - 0xE0000);
      })
      .join('');

    if (decoded.length > 0) {
      payloads.push({
        type: 'tag_stego',
        description: 'Unicode Tag Steganography (U+E0020 - U+E007E)',
        rawPayload: raw,
        byteCount: Buffer.byteLength(raw, 'utf8'),
        decodedText: decoded
      });
    }
  }

  return payloads;
}

/**
 * try and decode binary steganography embedded into zero width chars (U+200B, U+200C, U+200D, U+FEFF)
 */
export function decodeZeroWidthBinary(text: string): DecodedPayload[] {
  const payloads: DecodedPayload[] = [];
  const regex = /[\u200B\u200C\u200D\uFEFF\u3164\uFFA0]{8,}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];

    // map pairs: (200B->0, 200C->1), (200C->0, 200D->1), (200B->0, FEFF->1), (3164->0, FFA0->1), etc.
    const mappings: [string, string][] = [
      ['\u200B', '\u200C'],
      ['\u200C', '\u200D'],
      ['\u200B', '\uFEFF'],
      ['\u200C', '\u200B'],
      ['\u3164', '\uFFA0'],
      ['\uFFA0', '\u3164']
    ];

    for (const [zeroChar, oneChar] of mappings) {
      // check if sequence only contains following two chars
      const binaryBits: string[] = [];
      let valid = true;
      for (const ch of raw) {
        if (ch === zeroChar) binaryBits.push('0');
        else if (ch === oneChar) binaryBits.push('1');
        else {
          valid = false;
          break;
        }
      }

      if (valid && binaryBits.length >= 8 && binaryBits.length % 8 === 0) {
        const bitStr = binaryBits.join('');
        const bytes: number[] = [];
        for (let i = 0; i < bitStr.length; i += 8) {
          bytes.push(parseInt(bitStr.slice(i, i + 8), 2));
        }

        const isAsciiPrintable = bytes.every(b => (b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9);
        if (isAsciiPrintable) {
          const decoded = Buffer.from(bytes).toString('utf8');
          payloads.push({
            type: 'zero_width_binary',
            description: `zero width binary payload (0=${zeroChar.codePointAt(0)!.toString(16)}, 1=${oneChar.codePointAt(0)!.toString(16)})`,
            rawPayload: raw,
            byteCount: Buffer.byteLength(raw, 'utf8'),
            decodedText: decoded
          });
          break;
        }
      }
    }
  }

  return payloads;
}

/**
 * try and decode trailing space/tab binary steganography (SNOW-style).
 */
export function decodeWhitespaceBinary(text: string): DecodedPayload[] {
  const payloads: DecodedPayload[] = [];
  const lines = text.split(/\r?\n/);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const match = /([ \t]{8,})$/.exec(line);
    if (!match) continue;

    const trailing = match[1];
    // map space -> 0, tab -> 1
    const bits = Array.from(trailing)
      .map(ch => (ch === ' ' ? '0' : '1'))
      .join('');

    if (bits.length % 8 === 0) {
      const bytes: number[] = [];
      for (let i = 0; i < bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
      }
      const isAsciiPrintable = bytes.every(b => (b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9);
      if (isAsciiPrintable) {
        payloads.push({
          type: 'whitespace_binary',
          description: `Line ${lineIdx + 1} trailing Whitespace Binary (Space=0, Tab=1)`,
          rawPayload: trailing,
          byteCount: Buffer.byteLength(trailing, 'utf8'),
          decodedText: Buffer.from(bytes).toString('utf8')
        });
      }
    }
  }

  return payloads;
}

/**
 * check for mixed script homoglyphs embedded in latin text.
 */
export function detectHomoglyphs(text: string): HomoglyphMatch[] {
  const matches: HomoglyphMatch[] = [];
  const words = text.split(/([^\p{L}\p{N}]+)/gu);

  let charIndex = 0;
  let byteOffset = 0;
  let line = 1;
  let col = 1;

  for (const part of words) {
    // if word contains mostly latin letters plus homoglyphs
    const latinCount = (part.match(/[a-zA-Z]/g) || []).length;

    let partCharIndex = charIndex;
    let partByteOffset = byteOffset;
    let partLine = line;
    let partCol = col;

    for (const ch of part) {
      const cp = ch.codePointAt(0)!;
      const charByteLen = Buffer.byteLength(ch, 'utf8');

      const homoglyphEntry = HOMOGLYPHS_MAP.get(ch);
      const fullwidth = normalizeFullwidth(cp);
      const mathLatin = normalizeMathAlphanumeric(cp);

      if (homoglyphEntry && (latinCount > 0 || homoglyphEntry.script === 'Cyrillic' || homoglyphEntry.script === 'Greek')) {
        matches.push({
          char: ch,
          replacement: homoglyphEntry.latin,
          codePoint: cp,
          hex: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
          script: homoglyphEntry.script,
          index: partCharIndex,
          byteOffset: partByteOffset,
          line: partLine,
          column: partCol,
          surroundingWord: part
        });
      } else if (fullwidth) {
        matches.push({
          char: ch,
          replacement: fullwidth,
          codePoint: cp,
          hex: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
          script: 'Fullwidth',
          index: partCharIndex,
          byteOffset: partByteOffset,
          line: partLine,
          column: partCol,
          surroundingWord: part
        });
      } else if (mathLatin) {
        matches.push({
          char: ch,
          replacement: mathLatin,
          codePoint: cp,
          hex: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
          script: 'Mathematical Alphanumeric',
          index: partCharIndex,
          byteOffset: partByteOffset,
          line: partLine,
          column: partCol,
          surroundingWord: part
        });
      }

      if (ch === '\n') {
        partLine++;
        partCol = 1;
      } else {
        partCol++;
      }
      partCharIndex += ch.length;
      partByteOffset += charByteLen;
    }

    // advance total counters
    for (const ch of part) {
      if (ch === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      charIndex += ch.length;
      byteOffset += Buffer.byteLength(ch, 'utf8');
    }
  }

  return matches;
}

/**
 * scan text and start watermark + steganography detection
 */
export function detectWatermarks(text: string): DetectionResult {
  const matches: WatermarkMatch[] = [];
  const categories: Record<WatermarkCategory, number> = {
    zero_width: 0,
    unicode_tag: 0,
    directional: 0,
    variation_selector: 0,
    anomalous_space: 0,
    control_char: 0,
    homoglyph: 0,
    byte_anomaly: 0,
    hidden_payload: 0
  };

  let charIndex = 0;
  let byteOffset = 0;
  let line = 1;
  let column = 1;

  // use iterator to properly handle surrogate pairs / multi-byte code points
  for (const char of text) {
    const codePoint = char.codePointAt(0)!;
    const charBytes = Buffer.byteLength(char, 'utf8');
    const hex = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;

    if (isUnicodeTag(codePoint)) {
      categories.unicode_tag++;
      matches.push({
        category: 'unicode_tag',
        char,
        codePoint,
        hex,
        name: codePoint === 0xE0001 ? 'LANGUAGE TAG' : `UNICODE TAG 0x${(codePoint - 0xE0000).toString(16).toUpperCase()}`,
        index: charIndex,
        byteOffset,
        line,
        column,
        context: getContextSnippet(text, charIndex, hex),
        details: `hidden tag char (${hex}) used for steganography / prompt tracking`
      });
    } else if (INVISIBLE_CODEPOINTS.has(codePoint)) {
      const meta = INVISIBLE_CODEPOINTS.get(codePoint)!;
      categories[meta.category]++;
      matches.push({
        category: meta.category,
        char,
        codePoint,
        hex,
        name: meta.name,
        index: charIndex,
        byteOffset,
        line,
        column,
        context: getContextSnippet(text, charIndex, meta.name),
        details: meta.description
      });
    } else if (isVariationSelector(codePoint)) {
      categories.variation_selector++;
      matches.push({
        category: 'variation_selector',
        char,
        codePoint,
        hex,
        name: `VARIATION SELECTOR (${hex})`,
        index: charIndex,
        byteOffset,
        line,
        column,
        context: getContextSnippet(text, charIndex, hex),
        details: 'variation selector char altering glyph appearance or hiding state'
      });
    } else if (ANOMALOUS_WHITESPACE.has(codePoint)) {
      const meta = ANOMALOUS_WHITESPACE.get(codePoint)!;
      categories.anomalous_space++;
      matches.push({
        category: 'anomalous_space',
        char,
        codePoint,
        hex,
        name: meta.name,
        index: charIndex,
        byteOffset,
        line,
        column,
        context: getContextSnippet(text, charIndex, meta.name),
        suggestedReplacement: meta.suggestedReplacement
      });
    } else if (isNonPrintableControl(codePoint)) {
      categories.control_char++;
      matches.push({
        category: 'control_char',
        char,
        codePoint,
        hex,
        name: `CONTROL CHAR (${hex})`,
        index: charIndex,
        byteOffset,
        line,
        column,
        context: getContextSnippet(text, charIndex, hex),
        details: 'non-printable C0/C1 control code'
      });
    } else if (isPrivateUse(codePoint)) {
      categories.byte_anomaly++;
      matches.push({
        category: 'byte_anomaly',
        char,
        codePoint,
        hex,
        name: `PRIVATE USE AREA (${hex})`,
        index: charIndex,
        byteOffset,
        line,
        column,
        context: getContextSnippet(text, charIndex, hex),
        details: 'unicode private use area char used to inject hidden glyphs or payloads'
      });
    } else if (isFormatControl(char)) {
      categories.zero_width++;
      matches.push({
        category: 'zero_width',
        char,
        codePoint,
        hex,
        name: `FORMAT CONTROL (${hex})`,
        index: charIndex,
        byteOffset,
        line,
        column,
        context: getContextSnippet(text, charIndex, hex),
        details: 'procedurally detected Unicode Format (Cf) control character'
      });
    }

    if (char === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }

    charIndex += char.length;
    byteOffset += charBytes;
  }

  // find homoglyphs
  const homoglyphs = detectHomoglyphs(text);
  categories.homoglyph = homoglyphs.length;

  // detect n decode steganograph payloads
  const decodedPayloads: DecodedPayload[] = [
    ...decodeTagSteganography(text),
    ...decodeZeroWidthBinary(text),
    ...decodeWhitespaceBinary(text)
  ];
  categories.hidden_payload = decodedPayloads.length;

  const totalWatermarks = matches.length + homoglyphs.length + decodedPayloads.length;

  return {
    clean: totalWatermarks === 0,
    totalWatermarks,
    categories,
    matches,
    homoglyphs,
    decodedPayloads
  };
}
