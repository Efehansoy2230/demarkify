#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { sanitizeText } from './sanitizer.js';
import { detectWatermarks } from './detector.js';
import { processFile, processDirectory } from './file.js';
import { SanitizeOptions, DetectionResult } from './types.js';

// minimal ansi color helpers (written from scratch)
const isColorSupported = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR);
const c = {
  reset: isColorSupported ? '\x1b[0m' : '',
  bold: isColorSupported ? '\x1b[1m' : '',
  dim: isColorSupported ? '\x1b[2m' : '',
  red: isColorSupported ? '\x1b[31m' : '',
  green: isColorSupported ? '\x1b[32m' : '',
  yellow: isColorSupported ? '\x1b[33m' : '',
  blue: isColorSupported ? '\x1b[34m' : '',
  magenta: isColorSupported ? '\x1b[35m' : '',
  cyan: isColorSupported ? '\x1b[36m' : '',
  gray: isColorSupported ? '\x1b[90m' : '',
  bgRed: isColorSupported ? '\x1b[41m' : '',
  bgGreen: isColorSupported ? '\x1b[42m' : ''
};

const VERSION = '1.0.0';

function printHelp(): void {
  console.log(`
${c.bold}${c.cyan}demarkify${c.reset} ${c.dim}v${VERSION}${c.reset}
a fast, non-dependent tool/library to detect, decode, and remove hidden ai watermarks, steganography, invisible characters, homoglyphs, and even byte anomalies from any text.

${c.bold}USAGE${c.reset}
  $ demarkify [options] [input...]
  $ cat file_example.txt | demarkify [options]

${c.bold}INPUTS${c.reset}
  can be a direct string snippet, file path(s), or directory path(s).
  if no input is provided as arguments, will read from stdin as fallback.

${c.bold}OPTIONS${c.reset}
  ${c.cyan}-c, --check${c.reset}             dry run scan, exit with code 1 if watermarks ARE found, 0 if clean
  ${c.cyan}-w, --write${c.reset}             in place rewrite for file(s) and dirs
  ${c.cyan}-o, --output <path>${c.reset}     output path for a cleaned file or dir
  ${c.cyan}-v, --verbose${c.reset}           shows detailed match breakdown (byte offs, hex, decode payloads)
  ${c.cyan}--ascii${c.reset}                 transliterate all non-ascii chars and homoglyphs to pure 7bit ascii
  ${c.cyan}--homoglyphs${c.reset}            convert cyrillic, greek, and math lookalike homoglyphs to standard latin
  ${c.cyan}--no-normalize-spaces${c.reset}  preserve nonstandard unicode whitespaces
  ${c.cyan}--no-strip-trailing${c.reset}    do not strip trailing whitespace patterns from line endings.
  ${c.cyan}--preserve-newlines${c.reset}    do not normalize line endings: CRLF > LF
  ${c.cyan}--unicode-form <form>${c.reset}  unicode normal form: NFC, NFKC, NFKD, NFD, or none (default: NFC)
  ${c.cyan}--json${c.reset}                  output analysis results in json format.
  ${c.cyan}-h, --help${c.reset}              show this help message
  ${c.cyan}-V, --version${c.reset}           display your current demarkify version.

${c.bold}EXAMPLES${c.reset}
  ${c.dim}# clean text from stdin to stdout:${c.reset}
  $ cat prompt_response.txt | demarkify > clean.txt

  ${c.dim}# clean string snippet directly:${c.reset}
  $ demarkify "hidden\u200Bwatermark"

  ${c.dim}# check whether a file contains hidden watermarks:${c.reset}
  $ demarkify --check article.md

  ${c.dim}# sanitize all files in a directory recursively in-place:${c.reset}
  $ demarkify -w ./src/

  ${c.dim}# transliterate homoglyphs and output pure ascii:${c.reset}
  $ demarkify --ascii --homoglyphs essay_example.txt -o essay_example.clean.txt
`);
}

function unescapeString(str: string): string {
  try {
    return str
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  } catch {
    return str;
  }
}

async function readStdin(): Promise<string> {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

function formatMatchReport(detection: DetectionResult, verbose: boolean): void {
  if (detection.clean) {
    console.log(`\n  ${c.green}! completely clean.${c.reset} zero hidden watermarks or invisible chars were detected.`);
    return;
  }

  console.log(`\n  ${c.bold}${c.yellow}⚠ Found ${detection.totalWatermarks} watermark/anomaly markers:${c.reset}`);

  for (const [cat, count] of Object.entries(detection.categories)) {
    if (count > 0) {
      console.log(`    ${c.cyan}• ${cat.replace(/_/g, ' ')}:${c.reset} ${c.bold}${count}${c.reset}`);
    }
  }

  if (detection.decodedPayloads.length > 0) {
    console.log(`\n  ${c.bold}${c.magenta}decoded hidden payloads:${c.reset}`);
    for (const payload of detection.decodedPayloads) {
      console.log(`    ${c.bold}[${payload.description}]${c.reset}`);
      console.log(`    decoded text: ${c.green}${JSON.stringify(payload.decodedText)}${c.reset} (${payload.byteCount} bytes payload)`);
    }
  }

  if (detection.homoglyphs.length > 0 && verbose) {
    console.log(`\n  ${c.bold}${c.yellow}homoglyphs detected:${c.reset}`);
    for (const h of detection.homoglyphs.slice(0, 15)) {
      console.log(`    line ${h.line}:${h.column} | '${h.char}' (${h.hex}, ${h.script}) in "${h.surroundingWord}" -> '${h.replacement}'`);
    }
    if (detection.homoglyphs.length > 15) {
      console.log(`    ... and ${detection.homoglyphs.length - 15} more homoglyphs`);
    }
  }

  if (verbose && detection.matches.length > 0) {
    console.log(`\n  ${c.bold}${c.blue}detailed markers list:${c.reset}`);
    for (const m of detection.matches.slice(0, 20)) {
      console.log(
        `    ${c.gray}[${m.line}:${m.column}]${c.reset} ${c.yellow}${m.hex}${c.reset} ${c.bold}${m.name}${c.reset} (byte offset: ${m.byteOffset})`
      );
      console.log(`      context: ${c.dim}${m.context}${c.reset}`);
    }
    if (detection.matches.length > 20) {
      console.log(`    ... and ${detection.matches.length - 20} more markers`);
    }
  }
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 && process.stdin.isTTY) {
    printHelp();
    process.exit(0);
  }

  let checkMode = false;
  let writeInPlace = false;
  let outputPath: string | undefined;
  let verbose = false;
  let jsonOutput = false;
  const options: SanitizeOptions = {};

  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-V' || arg === '--version') {
      console.log(`demarkify v${VERSION}`);
      process.exit(0);
    } else if (arg === '-c' || arg === '--check') {
      checkMode = true;
    } else if (arg === '-w' || arg === '--write') {
      writeInPlace = true;
    } else if (arg === '-o' || arg === '--output') {
      outputPath = args[++i];
    } else if (arg === '-v' || arg === '--verbose') {
      verbose = true;
    } else if (arg === '--json') {
      jsonOutput = true;
    } else if (arg === '--ascii') {
      options.asciiOnly = true;
    } else if (arg === '--homoglyphs') {
      options.normalizeHomoglyphs = true;
    } else if (arg === '--no-normalize-spaces') {
      options.normalizeSpaces = false;
    } else if (arg === '--no-strip-trailing') {
      options.trimStegoTrailingWhitespace = false;
    } else if (arg === '--preserve-newlines') {
      options.normalizeNewlines = false;
    } else if (arg === '--unicode-form') {
      options.unicodeNormalization = args[++i] as any;
    } else if (arg.startsWith('-')) {
      console.error(`${c.red}unknown option:${c.reset} ${arg}`);
      process.exit(1);
    } else {
      positionalArgs.push(arg);
    }
  }

  // handle stdin if no positional args and stdin is not a tty
  if (positionalArgs.length === 0 && !process.stdin.isTTY) {
    const stdinContent = await readStdin();

    if (checkMode) {
      const detection = detectWatermarks(stdinContent);
      if (jsonOutput) {
        console.log(JSON.stringify(detection, null, 2));
      } else {
        formatMatchReport(detection, verbose);
      }
      process.exit(detection.clean ? 0 : 1);
    }

    const result = sanitizeText(stdinContent, options);

    if (outputPath) {
      fs.writeFileSync(path.resolve(outputPath), result.cleanText, 'utf8');
      if (verbose) {
        console.error(`${c.green}written cleaned output to ${outputPath} (${result.bytesSaved} bytes stripped)${c.reset}`);
      }
    } else if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      process.stdout.write(result.cleanText);
    }
    return;
  }

  // handle pos args (strings, files, or dirs)
  let anyDirty = false;

  for (const input of positionalArgs) {
    const isExistingPath = fs.existsSync(input);

    if (isExistingPath) {
      const stat = fs.statSync(input);

      if (stat.isDirectory()) {
        const dirResult = processDirectory(input, options, writeInPlace && !checkMode, outputPath);

        if (jsonOutput) {
          console.log(JSON.stringify(dirResult, null, 2));
        } else {
          console.log(`\n${c.bold}directory:${c.reset} ${input}`);
          console.log(`  scanned files: ${dirResult.totalFiles} (${dirResult.skippedFiles} binary/skipped)`);
          console.log(`  modified files: ${dirResult.modifiedFiles}`);
          console.log(`  clean files: ${dirResult.cleanFiles}`);
          console.log(`  watermarks removed: ${dirResult.totalWatermarksFound}`);
          console.log(`  total bytes saved: ${dirResult.totalBytesSaved}`);

          if (dirResult.modifiedFiles > 0) {
            anyDirty = true;
            if (verbose) {
              console.log(`\n  ${c.bold}modified files list:${c.reset}`);
              for (const f of dirResult.files.filter(f => f.changed)) {
                console.log(`    • ${f.path} (${f.detection.totalWatermarks} watermarks, -${f.bytesSaved} bytes)`);
              }
            }
          }
        }
      } else {
        // single file
        const fileResult = processFile(input, options, writeInPlace && !checkMode, outputPath);

        if (jsonOutput) {
          console.log(JSON.stringify(fileResult, null, 2));
        } else {
          console.log(`\n${c.bold}file:${c.reset} ${input}`);
          if (fileResult.skipped) {
            console.log(`  ${c.gray}skipped: ${fileResult.skipReason}${c.reset}`);
          } else {
            formatMatchReport(fileResult.detection, verbose);
            if (fileResult.changed) {
              anyDirty = true;
              console.log(`  bytes saved: ${c.green}${fileResult.bytesSaved}${c.reset} bytes`);
              if (fileResult.written) {
                console.log(`  ${c.green}saved clean content to ${fileResult.outputPath}${c.reset}`);
              } else if (!checkMode && !outputPath && !writeInPlace) {
                console.log(`\n${c.bold}clean text output:${c.reset}\n${fileResult.detection.matches ? sanitizeText(fs.readFileSync(input, 'utf8'), options).cleanText : ''}`);
              }
            }
          }
        }
      }
    } else {
      // direct string snippet
      const unescaped = unescapeString(input);
      if (checkMode) {
        const detection = detectWatermarks(unescaped);
        if (jsonOutput) {
          console.log(JSON.stringify(detection, null, 2));
        } else {
          formatMatchReport(detection, verbose);
        }
        if (!detection.clean) anyDirty = true;
      } else {
        const result = sanitizeText(unescaped, options);
        if (result.changed) anyDirty = true;

        if (outputPath) {
          fs.writeFileSync(path.resolve(outputPath), result.cleanText, 'utf8');
          if (verbose) {
            console.error(`${c.green}written cleaned output to ${outputPath}${c.reset}`);
          }
        } else if (jsonOutput) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          if (verbose) {
            formatMatchReport(result.detection, true);
          }
          console.log(result.cleanText);
        }
      }
    }
  }

  if (checkMode && anyDirty) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${c.red}Error:${c.reset}`, err.message);
  process.exit(1);
});
