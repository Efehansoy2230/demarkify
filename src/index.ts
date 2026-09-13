export * from './types.js';
export * from './constants.js';
export * from './detector.js';
export * from './sanitizer.js';
export * from './file.js';

// default simple single call helper
import { sanitizeText } from './sanitizer.js';
import { SanitizeOptions, SanitizeResult } from './types.js';

export function demarkify(text: string, options?: SanitizeOptions): SanitizeResult {
  return sanitizeText(text, options);
}

export default demarkify;
