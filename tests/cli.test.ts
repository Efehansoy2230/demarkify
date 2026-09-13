import { describe, it, expect } from 'vitest';
import { execa } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';

const execPromise = promisify(execa ? (execa as any) : require('node:child_process').exec);

const CLI_PATH = path.resolve(__dirname, '../src/cli.ts');

describe('cli E2E integration', () => {
  it('output help message with --help', async () => {
    const { stdout } = await execPromise(`pnpm exec tsx "${CLI_PATH}" --help`);
    expect(stdout).toContain('demarkify');
    expect(stdout).toContain('USAGE');
    expect(stdout).toContain('OPTIONS');
  });

  it('displays version with --version', async () => {
    const { stdout } = await execPromise(`pnpm exec tsx "${CLI_PATH}" --version`);
    expect(stdout).toContain('demarkify v1.0.0');
  });

  it('clean string args directly', async () => {
    const { stdout } = await execPromise(`pnpm exec tsx "${CLI_PATH}" "hello\\u200Bworld"`);
    expect(stdout.trim()).toBe('helloworld');
  });

  it('outputs json format when --json is passed', async () => {
    const { stdout } = await execPromise(`pnpm exec tsx "${CLI_PATH}" --json "hello\\u200Bworld"`);
    const parsed = JSON.parse(stdout);
    expect(parsed.changed).toBe(true);
    expect(parsed.cleanText).toBe('helloworld');
    expect(parsed.bytesSaved).toBeGreaterThan(0);
  });

  it('exits with code 1 in --check mode when dirty', async () => {
    try {
      await execPromise(`pnpm exec tsx "${CLI_PATH}" --check "dirty\\u200Btext"`);
      expect.fail('should have exited with code 1');
    } catch (err: any) {
      expect(err.code || err.exitCode || err.status).toBe(1);
    }
  });

  it('exits with code 0 in --check mode when clean', async () => {
    const { stdout } = await execPromise(`pnpm exec tsx "${CLI_PATH}" --check "pure clean text"`);
    expect(stdout.toLowerCase()).toContain('clean');
  });
});
