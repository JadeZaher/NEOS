// Builds uxqa/routes/ as a Next-pages-shaped shadow tree from wouter <Route path> declarations + the Sanic route table.
// node uxqa/adapter/gen-routes.mjs   -> "ROUTES pages=<n> apis=<n>"   see uxqa/adapter/AGENTS.md sec. routes
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const out = path.join(repo, 'uxqa', 'routes');
const appTsx = path.join(repo, 'charting-the-course', 'client', 'src', 'App.tsx');
const agentDir = path.join(repo, 'neos-operating-system', 'agent');

/** "/agreements/:id/edit" -> ["agreements", "[id]", "edit"]; "/" -> []. */
const toSegments = (route) => route.split('/').filter(Boolean).map((s) => (s.startsWith(':') ? `[${s.slice(1).replace(/\?$/, '')}]` : s));

function writeShadow(segments, ext) {
	// Next pages router: a leaf is "<last>.<ext>"; the root of a folder is "index.<ext>".
	const file = segments.length ? path.join(out, ...segments.slice(0, -1), segments.at(-1) + ext) : path.join(out, 'index' + ext);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, '');
}

fs.rmSync(out, { recursive: true, force: true });
const pagePaths = [...new Set([...fs.readFileSync(appTsx, 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]))];
for (const route of pagePaths) writeShadow(toSegments(route), '.tsx');

let apiPaths = [];
try {
	const listing = execFileSync('py', ['-c', [
		'from neos_agent.main import create_app',
		'app = create_app()',
		'print("\\n".join(sorted({"/" + r.path.lstrip("/") for r in app.router.routes})))',
	].join('\n')], { cwd: agentDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
	apiPaths = listing.split(/\r?\n/).filter((p) => p.startsWith('/api/'));
} catch (error) {
	console.error('WARN api inventory unavailable: ' + String(error.message).split('\n')[0]);
}
// Sanic params look like <id:uuid> or <id>; the trailing-slash variant of a route is the same route.
for (const route of new Set(apiPaths.map((p) => p.replace(/<([a-zA-Z_]+)(?::[^>]+)?>/g, ':$1').replace(/\/+$/, '')))) {
	writeShadow(toSegments(route), '.ts');
}
console.log(`ROUTES pages=${pagePaths.length} apis=${apiPaths.length}`);
