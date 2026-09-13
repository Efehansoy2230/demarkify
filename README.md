# demarkify

> a fast, non-dependent tool/library to detect, decode, and remove hidden ai watermarks, steganography, invisible characters, homoglyphs, and even byte anomalies from any text.

[![npm version](https://img.shields.io/npm/v/demarkify.svg?color=cb3837)](https://www.npmjs.com/package/demarkify)
[![npm downloads](https://img.shields.io/npm/dm/demarkify.svg?color=blue)](https://www.npmjs.com/package/demarkify)
[![GitHub release](https://img.shields.io/github/v/release/hnpf/demarkify?color=brightgreen)](https://github.com/hnpf/demarkify/releases)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![zero deps](https://img.shields.io/badge/dependencies-0%20runtime-brightgreen.svg)](#)

---

## what is `demarkify`?

LLMS, ai text generation models, and tracking systems often integrate subtle, invisible watermarks into generated/output text. these watermarks range from zero width unicode spaces and tag chars to directional overrides, invisible math operators, homoglyph char subs (like replacing latin letters with near-identical cyrillic or greek glyphs), and trailing whitespace binary modulations.

**`demarkify`** comes into play by completely eliminating these hidden markers by performing deep byte-level inspection, decoding any hidden payloads, and reconstructs completely clean text fully from scratch.

---

## what demarkify has to offer

- pure native nodejs / ts results in being extremely fast, lightweight, and secure.
- deep watermark and steganography detection
- zero width and invis codepoints: `ZWSP` (`U+200B`), `ZWNJ` (`U+200C`), `ZWJ` (`U+200D`), `BOM` (`U+FEFF`), `Word joiner` (`U+2060`), `soft hyphen` (`U+00AD`), `combining grapheme joiner` (`U+034F`), `mongolian vowel separator` (`U+180E`), `invisible operators` (`U+2061`-`U+2064`), etc.
- detects and decodes hidden payload chars in the `U+E0020` / `U+E007E` range used for prompt injection or llm output tracking 
- zerowidth and whitespace binary stego**: detects and decodes binary payloads embedded into zerowidth char sequences or trailing spaces/tabs.
- directional overrides & isolates: `LTR`/`RTL` marks, embeddings, overrides (`U+202A`–`U+202E`, `U+2066`/`U+2069`)
- homoglyphs and confusable scripts: identifies lookalike chars swapped in from cyrillic, greek, fullwidth, or mathematical alphanumeric blocks
- normalize non breaking spaces (`U+00A0`), thin spaces, em/en spaces, and ideographic spaces.
- non-printable control chars and byte anomalies
- complete scratch reconstruction: instead of naive regex replacement, text is parsed and rebuilt cleanly with canonical unicode normalizing (`NFC`/`NFKC`) and uniform line endings
- versatile inputs: supports direct string arguments, stdin pipes, individual files, and even entire directories, recursively
- CI/CD ready: `--check` flag returns exit code `1` if watermarks and such are detected, making it a viable option for git precommits.

---

## install

### option 1: global cli via pm
```bash
# using npm
npm install -g demarkify

# using pnpm
pnpm add -g demarkify

# using bun
bun add -g demarkify
```

### option 2: local project dep
```bash
npm install demarkify
# or
pnpm add demarkify
```

### option 3: standalone binaries (nodejs not required)
precompiled standalone binaries are available for download on the [GitHub releases](https://github.com/hnpf/demarkify/releases) page:

| platform | arch | download |
| :--- | :--- | :--- |
| **linux** | x86_64 | [`demarkify-v1.0.0-linux-x64.tar.gz`](https://github.com/hnpf/demarkify/releases/download/v1.0.0/demarkify-v1.0.0-linux-x64.tar.gz) |
| **linux** | ARM64 / AArch64 | [`demarkify-v1.0.0-linux-arm64.tar.gz`](https://github.com/hnpf/demarkify/releases/download/v1.0.0/demarkify-v1.0.0-linux-arm64.tar.gz) |
| **macOS** | Apple Silicon (M1/M2/M3/M4) | [`demarkify-v1.0.0-darwin-arm64.tar.gz`](https://github.com/hnpf/demarkify/releases/download/v1.0.0/demarkify-v1.0.0-darwin-arm64.tar.gz) |
| **macOS** | Intel x86_64 | [`demarkify-v1.0.0-darwin-x64.tar.gz`](https://github.com/hnpf/demarkify/releases/download/v1.0.0/demarkify-v1.0.0-darwin-x64.tar.gz) |
| **windows** | x86_64 | [`demarkify-v1.0.0-windows-x64.zip`](https://github.com/hnpf/demarkify/releases/download/v1.0.0/demarkify-v1.0.0-windows-x64.zip) |

---

## cli usage

### basic usage

```bash
# clean text from stdin and output clean text to stdout
cat ai_output.txt | demarkify > clean.txt

# clean a string snippet directly
demarkify "Hello\u200BWorld"

# check if file has watermarks (dryrun)
demarkify --check document_example.md

# sanitize a file in-place
demarkify -w document.md

# sanitize a file to a new destination
demarkify document.md -o document.clean.md

# recursively clean an entire directory in-place
demarkify -w ./src/
```

## programmatic api (ts / js)

you can import and use `demarkify` directly in your njs or ts projects:

```typescript
import {
  demarkify,
  detectWatermarks,
  sanitizeText,
  processFile,
  processDirectory
} from 'demarkify';

// inspecting text for watermarks
const detection = detectWatermarks('prompt text\u200Bwith hidden data');
console.log(detection.clean); // false
console.log(detection.totalWatermarks); // 1
console.log(detection.matches);

// clean text from scratch
const result = sanitizeText('some\u200B dirty\u00A0text', {
  normalizeSpaces: true,
  stripZeroWidth: true,
  unicodeNormalization: 'NFC'
});
console.log(result.cleanText); // "some dirty text"
console.log(result.bytesSaved); // 4

// process files or directories
const fileResult = processFile('./report.md', { normalizeHomoglyphs: true }, true);
console.log(fileResult.changed); // true if modified
```

---

## testing

```bash
# run unit and integ tests
pnpm test

# build ts to dist/
pnpm run build
```

---

## license

MIT / 2026 (READ ./LICENSE FOR MORE INFORMATIOn)
