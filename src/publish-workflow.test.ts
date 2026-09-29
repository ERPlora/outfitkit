// HUB NOTICE ON PUBLISH (ERPlora/hub#2321) — `publish.yml` tells the hub the moment a version is out.
//
// The hub's image installs `@erplora/outfitkit@latest` on every build, so a release that moves a
// pixel of the hub's screens reaches customers with no hub commit at all. Before this notice the hub
// only tested a new version at its next web push to develop or at its 03:08 cron — hours later. The
// hub's `test-web.yml` listens to `repository_dispatch: outfitkit-published` and tests develop against
// EXACTLY the version in `client_payload.version`; this file pins the sending half.
//
// The step's `run:` script is executed for real (bash + a fake `gh` on PATH), not grepped: what
// matters is the request it sends and that a missing token or a refused dispatch turns the run red
// instead of passing in silence — a notice nobody receives looks exactly like a notice that worked.
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const REPO = fileURLToPath(new URL('../', import.meta.url));
const WORKFLOW = readFileSync(join(REPO, '.github/workflows/publish.yml'), 'utf8');
const STEP_NAME = 'Notify ERPlora/hub (hub#2321)';

interface Step {
  /** The step's lines, from `- name:` to the next step. */
  text: string;
  /** The `run: |` block, de-indented. */
  run: string;
  /** Line index of the step inside the workflow. */
  at: number;
}

/** Steps of the (only) job, split on the 6-space `- ` that opens each one. */
function steps(): Step[] {
  const lines = WORKFLOW.split('\n');
  const starts = lines.flatMap((l, i) => (/^ {6}- /.test(l) ? [i] : []));
  return starts.map((start, n) => {
    const body = lines.slice(start, starts[n + 1] ?? lines.length);
    const runAt = body.findIndex((l) => /^ {8}run: \|\s*$/.test(l));
    const run =
      runAt < 0
        ? ''
        : body
            .slice(runAt + 1)
            .filter((l, i, all) => !(l.trim() === '' && all.slice(i).every((r) => r.trim() === '')))
            .map((l) => l.replace(/^ {10}/, ''))
            .join('\n');
    return { text: body.join('\n'), run, at: start };
  });
}

function step(name: string): Step | undefined {
  return steps().find((s) => s.text.startsWith(`      - name: ${name}`));
}

describe('publish.yml notifies the hub (hub#2321)', () => {
  it('has a notice step AFTER `npm publish`', () => {
    const notice = step(STEP_NAME);
    const publish = steps().find((s) => /^ {8}run: npm publish\b/m.test(s.text));
    expect(notice, `no step named "${STEP_NAME}"`).toBeDefined();
    expect(publish).toBeDefined();
    expect(notice!.at).toBeGreaterThan(publish!.at);
  });

  it('takes the token from the org secret through env, never inside the script', () => {
    const notice = step(STEP_NAME)!;
    expect(notice.text).toMatch(/^ {10}HUB_DISPATCH_TOKEN: \$\{\{ secrets\.GH_PAT \}\}$/m);
    expect(notice.run).not.toContain('${{');
  });

  describe('running the script', () => {
    let dir: string;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), 'outfitkit-hub-notice-'));
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@erplora/outfitkit', version: '0.1.119' }));
      // Fake gh: records its arguments and the JSON it was fed; `FAKE_GH_EXIT` fakes a refusal.
      writeFileSync(
        join(dir, 'gh'),
        '#!/usr/bin/env bash\nprintf "%s\\n" "$*" > "$FAKE_GH_DIR/args"\nprintf "%s" "$GH_TOKEN" > "$FAKE_GH_DIR/token"\ncat > "$FAKE_GH_DIR/stdin"\nexit "${FAKE_GH_EXIT:-0}"\n',
      );
      chmodSync(join(dir, 'gh'), 0o755);
    });

    afterEach(() => rmSync(dir, { recursive: true, force: true }));

    function runNotice(env: Record<string, string>) {
      const res = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', step(STEP_NAME)!.run], {
        cwd: dir,
        encoding: 'utf8',
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, FAKE_GH_DIR: dir, ...env },
      });
      const read = (f: string) => {
        try {
          return readFileSync(join(dir, f), 'utf8');
        } catch {
          return null;
        }
      };
      return { status: res.status, out: `${res.stdout}${res.stderr}`, args: read('args'), stdin: read('stdin'), token: read('token') };
    }

    it('sends outfitkit-published with the version just released', () => {
      const r = runNotice({ HUB_DISPATCH_TOKEN: 'tok-123' });
      expect(r.status, r.out).toBe(0);
      expect(r.args?.trim()).toBe('api repos/ERPlora/hub/dispatches --method POST --input -');
      expect(r.token).toBe('tok-123');
      expect(JSON.parse(r.stdin ?? 'null')).toEqual({
        event_type: 'outfitkit-published',
        client_payload: { version: '0.1.119' },
      });
    });

    it('fails loudly, without calling gh, when the token is empty', () => {
      const r = runNotice({ HUB_DISPATCH_TOKEN: '' });
      expect(r.status).not.toBe(0);
      expect(r.args).toBeNull();
      expect(r.out).toContain('hub_dispatch_token_missing');
    });

    it('fails loudly when the hub refuses the dispatch', () => {
      const r = runNotice({ HUB_DISPATCH_TOKEN: 'tok-123', FAKE_GH_EXIT: '1' });
      expect(r.status).not.toBe(0);
      expect(r.out).toContain('hub_dispatch_failed');
    });
  });
});
