#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Keep this allowlist small: unknown files always require the complete checks.
export function isDocumentation(path) {
  return (
    /^(?:[^/]+\.md|docs\/.*\.(?:md|txt)|openspec\/.*\.md|src\/(?:.*\/)?README\.md)$/.test(
      path,
    ) || /^openspec\/changes\/[^/]+\/\.openspec\.yaml$/.test(path)
  );
}

export function classifyChanges(eventName, paths) {
  if (eventName !== 'pull_request')
    return { runChecks: true, reason: 'Validação completa fora de PR.' };
  const documentationOnly = paths.length > 0 && paths.every(isDocumentation);
  return {
    runChecks: !documentationOnly,
    reason: documentationOnly
      ? 'PR somente documental: formatação e versão continuam verificadas.'
      : 'A PR altera código, configuração ou um caminho não documental.',
  };
}

export function readPullRequestPaths(cwd = process.cwd()) {
  // checkout fetch-depth: 2 supplies the merge commit and its parents. The first
  // parent is the target branch, so this covers the entire PR at its tested base.
  const parents = execFileSync(
    'git',
    ['rev-list', '--parents', '-n', '1', 'HEAD'],
    { cwd, encoding: 'utf8' },
  )
    .trim()
    .split(/\s+/);
  if (parents.length !== 3)
    throw new Error(
      'Esperado o commit de merge da PR; não é seguro dispensar checks.',
    );
  return execFileSync(
    'git',
    ['diff', '--no-renames', '--name-only', '-z', 'HEAD^1', 'HEAD'],
    { cwd, encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
}

function main() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const paths = eventName === 'pull_request' ? readPullRequestPaths() : [];
  const scope = classifyChanges(eventName, paths);
  if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT ausente.');
  appendFileSync(process.env.GITHUB_OUTPUT, `run_checks=${scope.runChecks}\n`);
  console.log(scope.reason);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main();
