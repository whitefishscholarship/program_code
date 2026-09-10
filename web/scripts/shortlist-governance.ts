import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import ts from 'typescript';

// Reproduce the deployed import closure from Git blobs, independently of today's checkout.
export function historicalRuntimeClosureSha256(repoRoot: string, commit: string): string {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('An exact historical runtime commit is required.');
  const git = (args: string[]) => execFileSync('git', args, { cwd: repoRoot, maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const paths = new Set(git(['ls-tree', '-r', '--name-only', commit, '--', 'web']).toString().trim().split('\n'));
  const queue = [...paths].filter(p => /^web\/src\/app\/.*\/(page|layout|route)\.(ts|tsx|js|jsx)$/.test(p));
  for (const p of ['web/src/app/page.tsx', 'web/src/app/layout.tsx', 'web/src/middleware.ts']) if (paths.has(p)) queue.push(p);
  const visited = new Map<string, Buffer>();
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'];
  while (queue.length) {
    const p = queue.shift()!;
    if (visited.has(p)) continue;
    const bytes = git(['show', `${commit}:${p}`]); visited.set(p, bytes);
    if (!/\.(ts|tsx|js|jsx)$/.test(p)) continue;
    for (const { fileName: specifier } of ts.preProcessFile(bytes.toString(), true, true).importedFiles) {
      const target = specifier.startsWith('@/') ? `web/src/${specifier.slice(2)}` : specifier.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(p), specifier)) : null;
      if (!target) continue;
      if (!target.startsWith('web/')) throw new Error('Historical import escapes web.');
      const resolved = [target, ...extensions.map(ext => target + ext), ...extensions.map(ext => `${target}/index${ext}`)].find(p => paths.has(p));
      if (!resolved) throw new Error(`Unresolved historical import ${specifier}`);
      queue.push(resolved);
    }
  }
  if (!visited.size) throw new Error('Historical runtime closure is empty.');
  const sha = (bytes: Buffer | string) => crypto.createHash('sha256').update(bytes).digest('hex');
  return sha(JSON.stringify([...visited].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([p,bytes]) => ({ path: p.slice(4), sha256: sha(bytes) }))));
}

export function permitsLocalShortlistPreparation(id: string, blockers: string[], hosted: boolean): boolean {
  return id === 'PLAN-REV13' && !hosted && blockers.includes('PLAN-REV13-awaits-exact-Git-Vercel-effect-authority-or-verified-suppression');
}
