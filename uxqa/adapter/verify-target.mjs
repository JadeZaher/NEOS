// Reads the uxqa sentinel AppSetting through the running server with a persona session: OK only if the server is on neos_uxqa.
// node verify-target.mjs <baseUrl> <sessions.json>   prints one status line; never prints the sessions file.
import fs from 'node:fs';

const [baseUrl, sessionsFile] = process.argv.slice(2);
const done = (line, code) => { console.log(line); process.exit(code); };

if (!fs.existsSync(sessionsFile)) done('OK local health (sentinel unchecked: no sessions yet)', 0);
const withCookie = JSON.parse(fs.readFileSync(sessionsFile, 'utf8')).find((entry) => entry.cookie);
if (!withCookie) done('REFUSED no persona session to read the sentinel with', 2);

try {
	const response = await fetch(`${baseUrl}/api/v1/settings/?key=uxqa_environment`, {
		headers: { cookie: `neos_session=${withCookie.cookie}`, accept: 'application/json' },
		signal: AbortSignal.timeout(10_000),
	});
	const body = await response.json().catch(() => ({}));
	if (response.status === 401) done('REFUSED server rejected the seeded session (server is not on the uxqa DB?)', 2);
	if (body?.value?.db === 'neos_uxqa') done('OK server db=neos_uxqa', 0);
	done(`REFUSED sentinel mismatch (status ${response.status})`, 2);
} catch (error) {
	done(`REFUSED sentinel unreadable (${String(error.message || error).slice(0, 60)})`, 2);
}
