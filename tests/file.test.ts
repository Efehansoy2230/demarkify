import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { processFile, processDirectory, isBinaryBuffer } from '../src/file.js';

describe('file and dir processing', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'demarkify-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('detect binary buffers correctly', () => {
    const textBuf = Buffer.from('plain text content');
    const binBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x0d]);

    expect(isBinaryBuffer(textBuf)).toBe(false);
    expect(isBinaryBuffer(binBuf)).toBe(true);
  });

  it('cleans file in place when writeInPlace is true', () => {
    const filePath = path.join(tempDir, 'dirty.txt');
    fs.writeFileSync(filePath, 'hello\u200Bworld\u200C!', 'utf8');

    const result = processFile(filePath, {}, true);
    expect(result.changed).toBe(true);
    expect(result.written).toBe(true);

    const after = fs.readFileSync(filePath, 'utf8');
    expect(after).toBe('helloworld!');
  });

  it('cleans file to output dest', () => {
    const filePath = path.join(tempDir, 'dirty.txt');
    const outPath = path.join(tempDir, 'clean.txt');
    fs.writeFileSync(filePath, 'hello\u200Bworld!', 'utf8');

    const result = processFile(filePath, {}, false, outPath);
    expect(result.changed).toBe(true);
    expect(result.written).toBe(true);

    const src = fs.readFileSync(filePath, 'utf8');
    const dest = fs.readFileSync(outPath, 'utf8');
    expect(src).toBe('hello\u200Bworld!');
    expect(dest).toBe('helloworld!');
  });

  it('processes directory recursively', () => {
    const subDir = path.join(tempDir, 'sub');
    fs.mkdirSync(subDir);

    fs.writeFileSync(path.join(tempDir, 'a.txt'), 'file\u200BA', 'utf8');
    fs.writeFileSync(path.join(subDir, 'b.txt'), 'file\u200CB', 'utf8');
    fs.writeFileSync(path.join(subDir, 'c.txt'), 'clean file C', 'utf8');

    const result = processDirectory(tempDir, {}, true);
    expect(result.totalFiles).toBe(3);
    expect(result.modifiedFiles).toBe(2);
    expect(result.cleanFiles).toBe(1);

    expect(fs.readFileSync(path.join(tempDir, 'a.txt'), 'utf8')).toBe('fileA');
    expect(fs.readFileSync(path.join(subDir, 'b.txt'), 'utf8')).toBe('fileB');
    expect(fs.readFileSync(path.join(subDir, 'c.txt'), 'utf8')).toBe('clean file C');
  });

  it('skip binary files during dir processing', () => {
    const binPath = path.join(tempDir, 'image.png');
    fs.writeFileSync(binPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x0d]));

    const result = processDirectory(tempDir, {}, true);
    expect(result.skippedFiles).toBe(1);
  });
});
