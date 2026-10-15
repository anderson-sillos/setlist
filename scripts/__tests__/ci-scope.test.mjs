import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

import { classifyChanges, readPullRequestPaths } from '../ci-scope.mjs';

test('dispensa etapas pesadas somente para uma PR com arquivos documentais conhecidos', () => {
  assert.equal(
    classifyChanges('pull_request', [
      'README.md',
      'docs/CI.md',
      'src/testing/README.md',
      'openspec/changes/refactor/.openspec.yaml',
      'openspec/changes/refactor/tasks.md',
    ]).runChecks,
    false,
  );
  for (const path of [
    'docs/termos.html',
    'docs/legal.css',
    '.github/workflows/ci.yml',
    'package-lock.json',
    'vendor/package/index.js',
    'src/app/index.tsx',
    'scripts/unknown.txt',
    'src/features/guide.md',
    'openspec/config.yaml',
  ]) {
    assert.equal(
      classifyChanges('pull_request', ['README.md', path]).runChecks,
      true,
      path,
    );
  }
  assert.equal(classifyChanges('pull_request', []).runChecks, true);
  assert.equal(classifyChanges('push', ['README.md']).runChecks, true);
  assert.equal(
    classifyChanges('workflow_dispatch', ['README.md']).runChecks,
    true,
  );
});

test('classifica uma PR documental em checkout raso e falha quando faltam os pais do merge', () => {
  const root = mkdtempSync(join(tmpdir(), 'setlist-ci-shallow-'));
  const git = (cwd, ...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  const run = (cwd, output) =>
    spawnSync(process.execPath, [resolve('scripts/ci-scope.mjs')], {
      cwd,
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_OUTPUT: output,
      },
      encoding: 'utf8',
    });
  try {
    git(root, 'init', '-b', 'main', 'source');
    const source = join(root, 'source');
    git(source, 'config', 'user.name', 'CI Test');
    git(source, 'config', 'user.email', 'ci@example.test');
    writeFileSync(join(source, 'app.js'), 'export const value = 1;\n');
    git(source, 'add', '.');
    git(source, 'commit', '-m', 'base');
    git(source, 'checkout', '-b', 'docs');
    writeFileSync(join(source, 'README.md'), 'Documentação\n');
    git(source, 'add', '.');
    git(source, 'commit', '-m', 'docs');
    git(source, 'checkout', 'main');
    git(source, 'merge', '--no-ff', 'docs', '-m', 'merge');
    git(root, 'clone', '--depth', '2', '--no-local', source, 'depth-two');
    const depthTwo = join(root, 'depth-two');
    assert.deepEqual(readPullRequestPaths(depthTwo), ['README.md']);
    const output = join(root, 'outputs');
    const documented = run(depthTwo, output);
    assert.equal(documented.status, 0, documented.stderr);
    assert.equal(readFileSync(output, 'utf8'), 'run_checks=false\n');
    git(root, 'clone', '--depth', '1', '--no-local', source, 'depth-one');
    const missingOutput = join(root, 'missing-outputs');
    const incomplete = run(join(root, 'depth-one'), missingOutput);
    assert.notEqual(incomplete.status, 0);
    assert.equal(existsSync(missingOutput), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('compara a PR inteira e detecta código removido mesmo quando renomeado para documentação', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'setlist-ci-scope-'));
  const git = (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  try {
    git('init', '-b', 'main');
    git('config', 'user.name', 'CI Test');
    git('config', 'user.email', 'ci@example.test');
    writeFileSync(join(cwd, 'app.js'), 'export const value = 1;\n');
    git('add', '.');
    git('commit', '-m', 'base');
    git('checkout', '-b', 'feature');
    git('mv', 'app.js', 'README.md');
    git('commit', '-m', 'rename');
    writeFileSync(join(cwd, 'NOTES.md'), 'Documentação adicional\n');
    git('add', '.');
    git('commit', '-m', 'docs');
    git('checkout', 'main');
    git('merge', '--no-ff', 'feature', '-m', 'merge');
    assert.deepEqual(readPullRequestPaths(cwd).sort(), [
      'NOTES.md',
      'README.md',
      'app.js',
    ]);
    const output = join(cwd, 'outputs');
    const result = spawnSync(
      process.execPath,
      [resolve('scripts/ci-scope.mjs')],
      {
        cwd,
        env: {
          ...process.env,
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_OUTPUT: output,
        },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(output, 'utf8'), 'run_checks=true\n');
    git('checkout', 'feature');
    assert.throws(() => readPullRequestPaths(cwd), /não é seguro dispensar/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
