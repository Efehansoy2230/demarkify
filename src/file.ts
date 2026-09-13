import * as fs from 'node:fs';
import * as path from 'node:path';
import { sanitizeText } from './sanitizer.js';
import { detectWatermarks } from './detector.js';
import { DirectoryProcessResult, FileProcessResult, SanitizeOptions } from './types.js';

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '.idea',
  '.vscode'
]);

/**
 * check if buffer has binary data instead of plaintext.
 */
export function isBinaryBuffer(buffer: Buffer): boolean {
  const checkLen = Math.min(buffer.length, 8000);
  if (checkLen === 0) return false;

  let nullCount = 0;
  for (let i = 0; i < checkLen; i++) {
    if (buffer[i] === 0x00) {
      nullCount++;
    }
  }

  // if null bytes found > virtually always binary file
  return nullCount > 0;
}

/**
 * proecss single file: detect watermarks and clean if requested
 */
export function processFile(
  filePath: string,
  options: SanitizeOptions = {},
  writeInPlace: boolean = false,
  outputPath?: string
): FileProcessResult {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`file not found: ${filePath}`);
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    throw new Error(`path is not a regular file: ${filePath}`);
  }

  const rawBuffer = fs.readFileSync(resolvedPath);
  const isBinary = isBinaryBuffer(rawBuffer);

  if (isBinary) {
    return {
      path: filePath,
      isBinary: true,
      skipped: true,
      skipReason: 'binary file skipped',
      changed: false,
      detection: {
        clean: true,
        totalWatermarks: 0,
        categories: {
          zero_width: 0,
          unicode_tag: 0,
          directional: 0,
          variation_selector: 0,
          anomalous_space: 0,
          control_char: 0,
          homoglyph: 0,
          byte_anomaly: 0,
          hidden_payload: 0
        },
        matches: [],
        homoglyphs: [],
        decodedPayloads: []
      },
      bytesOriginal: rawBuffer.length,
      bytesClean: rawBuffer.length,
      bytesSaved: 0,
      written: false
    };
  }

  const originalText = rawBuffer.toString('utf8');
  const sanitizeResult = sanitizeText(originalText, options);

  let written = false;
  let targetPath = outputPath;

  if (writeInPlace && sanitizeResult.changed) {
    fs.writeFileSync(resolvedPath, sanitizeResult.cleanText, 'utf8');
    written = true;
    targetPath = resolvedPath;
  } else if (outputPath && sanitizeResult.changed) {
    const outDir = path.dirname(path.resolve(outputPath));
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(outputPath), sanitizeResult.cleanText, 'utf8');
    written = true;
  }

  return {
    path: filePath,
    isBinary: false,
    skipped: false,
    changed: sanitizeResult.changed,
    detection: sanitizeResult.detection,
    bytesOriginal: sanitizeResult.bytesOriginal,
    bytesClean: sanitizeResult.bytesClean,
    bytesSaved: sanitizeResult.bytesSaved,
    written,
    outputPath: targetPath
  };
}

/**
 * recursive collect all text files in a dir
 */
export function collectFiles(dirPath: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * process a directory of files recursively
 */
export function processDirectory(
  dirPath: string,
  options: SanitizeOptions = {},
  writeInPlace: boolean = false,
  outputDir?: string
): DirectoryProcessResult {
  const resolvedDir = path.resolve(dirPath);

  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`directory not found: ${dirPath}`);
  }

  const filePaths = collectFiles(resolvedDir);
  const fileResults: FileProcessResult[] = [];

  let modifiedFiles = 0;
  let cleanFiles = 0;
  let skippedFiles = 0;
  let totalWatermarksFound = 0;
  let totalBytesSaved = 0;

  for (const filePath of filePaths) {
    let fileOutputPath: string | undefined;
    if (outputDir) {
      const relPath = path.relative(resolvedDir, filePath);
      fileOutputPath = path.join(path.resolve(outputDir), relPath);
    }

    const res = processFile(filePath, options, writeInPlace, fileOutputPath);
    fileResults.push(res);

    if (res.skipped) {
      skippedFiles++;
    } else if (res.changed) {
      modifiedFiles++;
      totalBytesSaved += res.bytesSaved;
      totalWatermarksFound += res.detection.totalWatermarks;
    } else {
      cleanFiles++;
    }
  }

  return {
    totalFiles: filePaths.length,
    processedFiles: filePaths.length - skippedFiles,
    modifiedFiles,
    cleanFiles,
    skippedFiles,
    totalWatermarksFound,
    totalBytesSaved,
    files: fileResults
  };
}
