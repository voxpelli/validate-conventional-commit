#!/usr/bin/env node
/* eslint-disable no-console */

// The exact types of @commitlint/config-conventional, based on the Angular convention:
// https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/config-conventional/src/index.ts
const EXACT_COMMIT_TYPES = new Set([
  'build',
  'chore',
  'ci',
  'docs',
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
  'style',
  'test',
]);

const isStrict = process.argv.includes('--strict');

let commitMessage = '';

if (process.stdin.isTTY) {
  console.error('No input was sent to commit message validator');
  process.exit(1);
}

for await (const item of process.stdin) {
  commitMessage += item;
}

if (commitMessage.trim() === '') {
  console.error('Empty commit message');
  process.exit(1);
}

// eslint-disable-next-line regexp/no-unused-capturing-group
const conventionalCommitMessage = /^(?<type>\w+)(?:\((?<scope>\w+)\))?(?<breaking>!?): (?<description>[^\n]+)/;

const match = conventionalCommitMessage.exec(commitMessage);

if (!match) {
  console.error('Invalid commit message, does not follow conventional commits');
  process.exit(1);
}

const type = match.groups?.['type'] ?? '';

if (isStrict && !EXACT_COMMIT_TYPES.has(type)) {
  console.error(`Invalid commit type "${type}", expected one of: ${[...EXACT_COMMIT_TYPES].toSorted().join(', ')}`);
  process.exit(1);
}
