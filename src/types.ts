export type WatermarkCategory =
  | 'zero_width'
  | 'unicode_tag'
  | 'directional'
  | 'variation_selector'
  | 'anomalous_space'
  | 'control_char'
  | 'homoglyph'
  | 'byte_anomaly'
  | 'hidden_payload';

export interface WatermarkMatch {
  category: WatermarkCategory;
  char: string;
  codePoint: number;
  hex: string;
  name: string;
  index: number;
  byteOffset: number;
  line: number;
  column: number;
  context: string;
  details?: string;
  suggestedReplacement?: string;
}

export interface DecodedPayload {
  type: 'tag_stego' | 'zero_width_binary' | 'whitespace_binary';
  description: string;
  rawPayload: string;
  byteCount: number;
  decodedText: string;
}

export interface HomoglyphMatch {
  char: string;
  replacement: string;
  codePoint: number;
  hex: string;
  script: string;
  index: number;
  byteOffset: number;
  line: number;
  column: number;
  surroundingWord: string;
}

export interface DetectionResult {
  clean: boolean;
  totalWatermarks: number;
  categories: Record<WatermarkCategory, number>;
  matches: WatermarkMatch[];
  homoglyphs: HomoglyphMatch[];
  decodedPayloads: DecodedPayload[];
}

export interface SanitizeOptions {
  /** replace non standard spaces (NBSP, em, en, thin, etc.) with ascii spaces ' ' */
  normalizeSpaces?: boolean;
  /** strip zero width chars, invisible joiners, and separators */
  stripZeroWidth?: boolean;
  /** strip unicode tag chars (U+E0001, U+E0020 - U+E007F) */
  stripTags?: boolean;
  /** strip directional override and isolate characters */
  stripDirectional?: boolean;
  /** strip variation selectors (U+FE00 - U+FE0F, U+E0100 - U+E01EF) */
  stripVariationSelectors?: boolean;
  /** strip non printable control chars besides \t, \n, \r */
  stripControlChars?: boolean;
  /** replace mixed script homoglyphs with normal Latin/ascii equivalents */
  normalizeHomoglyphs?: boolean;
  /** convert all text to pure 7-bit ASCII, transliterating characters */
  asciiOnly?: boolean;
  /** normalize line endings to \n */
  normalizeNewlines?: boolean;
  /** strip steganographic trailing whitespace from line ends */
  trimStegoTrailingWhitespace?: boolean;
  /** unicode normalization form to apply (default: 'NFC') */
  unicodeNormalization?: 'NFC' | 'NFKD' | 'NFKC' | 'NFD' | 'none';
}

export interface SanitizeResult {
  original: string;
  cleanText: string;
  changed: boolean;
  detection: DetectionResult;
  bytesOriginal: number;
  bytesClean: number;
  bytesSaved: number;
}

export interface FileProcessResult {
  path: string;
  isBinary: boolean;
  skipped: boolean;
  skipReason?: string;
  changed: boolean;
  detection: DetectionResult;
  bytesOriginal: number;
  bytesClean: number;
  bytesSaved: number;
  written: boolean;
  outputPath?: string;
}

export interface DirectoryProcessResult {
  totalFiles: number;
  processedFiles: number;
  modifiedFiles: number;
  cleanFiles: number;
  skippedFiles: number;
  totalWatermarksFound: number;
  totalBytesSaved: number;
  files: FileProcessResult[];
}
