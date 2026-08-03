import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const cliPath = fileURLToPath(new URL('../cli.js', import.meta.url));

/**
 * Runs the CLI with the given commit message on stdin
 *
 * @param {string} commitMessage - the commit message to validate
 * @param {string[]} [args] - CLI arguments
 * @returns {Promise<{ status: number | null, stderr: string }>} the exit status and stderr of the CLI
 */
function runCli (commitMessage, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', (status) => {
      resolve({ status, stderr });
    });

    child.stdin.end(commitMessage);
  });
}

test('accepts a valid conventional commit message', async () => {
  const result = await runCli('feat: add a new feature');

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
});

test('accepts a scope', async () => {
  const result = await runCli('fix(core): fix a bug');

  assert.equal(result.status, 0);
});

test('accepts a breaking change marker', async () => {
  const result = await runCli('feat!: drop support for old versions');

  assert.equal(result.status, 0);
});

test('accepts any type by default', async () => {
  const result = await runCli('tests: some random type');

  assert.equal(result.status, 0);
});

test('rejects a message without a conventional commit format', async () => {
  const result = await runCli('this is not a conventional commit');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid commit message/);
});

test('rejects an empty commit message', async () => {
  const result = await runCli('\n\n');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Empty commit message/);
});

test('accepts all the exact conventional commit types in strict mode', async () => {
  const validTypes = ['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'];

  for (const type of validTypes) {
    const result = await runCli(`${type}: a valid message`, ['--strict']);

    assert.equal(result.status, 0, `expected ${type}: to be accepted`);
    assert.equal(result.stderr, '', `expected ${type}: to pass without error`);
  }
});

test('rejects a non-exact type in strict mode', async () => {
  const result = await runCli('tests: not an exact type', ['--strict']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid commit type "tests"/);
  assert.match(result.stderr, /expected one of:/);
});

test('rejects a pluralized type in strict mode', async () => {
  const result = await runCli('testing: not an exact type', ['--strict']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid commit type "testing"/);
});

test('accepts an exact type with scope and breaking marker in strict mode', async () => {
  const result = await runCli('chore(deps)!: update dependencies', ['--strict']);

  assert.equal(result.status, 0);
});
