/**
 * Scripted API smoke test for the Go backend (`back-pop`).
 *
 * Drives the exact request shapes `src/api/endpoints.ts` sends, end to end,
 * against the Firebase emulators + `back-pop make run`. Catches payload-shape
 * drift between `src/api/types.ts` and `back-pop/api/openapi.yaml` — the thing
 * that stays invisible to `tsc`.
 *
 * Prereqs (see `/smoke-backend` or README "Backend smoke test"):
 *   1. Firebase emulators running (`npm run emulators` or the emulators-only
 *      part of `npm run dev:emulators`) on the default ports.
 *   2. `npm run seed` (seed users alice..frank; the flow itself uses fresh games).
 *   3. `make run` in `../back-pop` — Go service on :8090.
 *
 * Usage: `node scripts/smoke-backend.mjs`  (exit 0 = all green)
 */

const AUTH = process.env.AUTH_EMULATOR_URL ?? 'http://127.0.0.1:9099';
const API = process.env.BACKEND_ORIGIN ?? 'http://127.0.0.1:8090';
const PROJECT = process.env.FIREBASE_PROJECT_ID ?? 'demo-pop';

const b64url = (s) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Mint a Firebase ID token for a seed user via the Auth emulator (unsigned custom token → exchange). */
async function mintToken(uid) {
  const now = Math.floor(Date.now() / 1000);
  const svc = `firebase-auth-emulator@${PROJECT}.iam.gserviceaccount.com`;
  const header = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      iss: svc,
      sub: svc,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: now,
      exp: now + 3600,
      uid,
      claims: { isGuest: uid.startsWith('guest_') },
    })
  );
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=emulator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: `${header}.${payload}.`, returnSecureToken: true }),
  });
  const body = await res.json();
  if (!body.idToken) throw new Error(`mint ${uid} failed: ${JSON.stringify(body)} — is the Auth emulator up?`);
  return body.idToken;
}

const T = {};
let pass = 0;
let fail = 0;
const failures = [];

async function call(method, path, { token = T.alice, body, query } = {}) {
  let url = API + path;
  if (query) url += '?' + new URLSearchParams(query);
  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

/** Assert the response status is one of `ok`; record + print pass/fail. */
function expect(label, res, ok = [200, 201, 204]) {
  const good = ok.includes(res.status);
  if (good) {
    pass++;
  } else {
    fail++;
    failures.push({ label, res });
  }
  const body = good || res.data === undefined ? '' : '  ' + JSON.stringify(res.data).slice(0, 180);
  console.log(`  ${good ? 'ok  ' : 'FAIL'} ${label} → ${res.status}${body}`);
  return res;
}

async function main() {
  for (const u of ['alice', 'bob', 'charlie']) T[u] = await mintToken(u);
  console.log('minted tokens:', Object.keys(T).join(', '), '\n');

  console.log('== auth ==');
  expect('GET /healthz (no token)', await call('GET', '/healthz', { token: null }), [200]);
  expect('GET /games (no token) → 401', await call('GET', '/games', { token: null, query: { status: 'edit' } }), [401]);

  console.log('\n== structure / editor (fresh game) ==');
  const g = expect(
    'POST /games (createGame + organizerName)',
    await call('POST', '/games', {
      body: {
        title: 'Smoke Game',
        lang: 'en',
        maxPlayers: 4,
        roundScorePolicy: 'ranking',
        organizerName: 'Quizmaster Al',
      },
    }),
    [201]
  ).data?.id;
  expect('GET /games?status=edit', await call('GET', '/games', { query: { status: 'edit' } }), [200]);
  const r1 = expect(
    'POST /games/{g}/rounds (mcq)',
    await call('POST', `/games/${g}/rounds`, { body: { title: 'R1', type: 'mcq' } }),
    [201]
  ).data?.id;
  const r2 = expect(
    'POST /games/{g}/rounds (basic)',
    await call('POST', `/games/${g}/rounds`, { body: { title: 'R2', type: 'basic' } }),
    [201]
  ).data?.id;
  expect(
    'POST .../rounds/{r1}/questions mcq_1',
    await call('POST', `/games/${g}/rounds/${r1}/questions`, { body: { questionId: 'mcq_1' } })
  );
  expect(
    'POST .../rounds/{r1}/questions mcq_2',
    await call('POST', `/games/${g}/rounds/${r1}/questions`, { body: { questionId: 'mcq_2' } })
  );
  expect(
    'PUT .../questions/mcq_1 {thinking_time,seconds}',
    await call('PUT', `/games/${g}/rounds/${r1}/questions/mcq_1`, { body: { action: 'thinking_time', seconds: 20 } })
  );
  expect(
    'PUT .../rounds/{r1} {update, reordered}',
    await call('PUT', `/games/${g}/rounds/${r1}`, { body: { action: 'update', questions: ['mcq_2', 'mcq_1'] } })
  );
  expect(
    'PUT .../rounds/{r1} {thinking_time}',
    await call('PUT', `/games/${g}/rounds/${r1}`, { body: { action: 'thinking_time', thinkingTime: 25 } })
  );
  expect(
    'PUT .../rounds/{r1} {challenge_time}',
    await call('PUT', `/games/${g}/rounds/${r1}`, { body: { action: 'challenge_time', challengeTime: 30 } })
  );
  expect(
    'POST .../rounds/{r2}/questions basic_1',
    await call('POST', `/games/${g}/rounds/${r2}/questions`, { body: { questionId: 'basic_1' } })
  );
  expect(
    'DELETE .../rounds/{r2}/questions/basic_1',
    await call('DELETE', `/games/${g}/rounds/${r2}/questions/basic_1`)
  );

  console.log('\n== users ==');
  const users = expect(
    'GET /users?ids=alice,bob,ghost',
    await call('GET', '/users', { query: { ids: 'alice,bob,ghost' } }),
    [200]
  );
  const shapeOk =
    Array.isArray(users.data) && users.data.length === 2 && users.data.every((u) => u.id && u.name && 'image' in u);
  expect('  → shape [{id,name,image}], ghost omitted', { status: shapeOk ? 200 : 500, data: users.data }, [200]);

  // A full mcq + a full buzzer question, each on its own fresh game with two
  // teams, driven through a VALID game lifecycle — back-pop's precondition guard
  // layer now enforces the state machine, so the order matters:
  //   launch (game_edit→game_start) → players join + ready in the lobby →
  //   game start (game_start→game_home) → round select (→round_start) →
  //   round start (→question_active) → play → round question_end.
  // `reset` / `countdown_end` / `question_end` (and the guard-covered `end`
  // question action, not re-exercised here) all share the bare `{action}` shape.
  for (const type of ['mcq', 'basic']) {
    console.log(`\n== gameplay: ${type} question (fresh game) ==`);
    const gid = (
      await call('POST', '/games', {
        body: { title: `${type} smoke`, lang: 'en', maxPlayers: 4, roundScorePolicy: 'ranking' },
      })
    ).data.id;
    const rid = (await call('POST', `/games/${gid}/rounds`, { body: { title: 'R', type } })).data.id;
    await call('POST', `/games/${gid}/rounds/${rid}/questions`, { body: { questionId: `${type}_1` } });
    await call('POST', `/games/${gid}/rounds/${rid}/questions`, { body: { questionId: `${type}_2` } });

    // --- lobby: launch, then players join + ready while game_start ---
    expect('launch', await call('PUT', `/games/${gid}`, { body: { action: 'launch' } }));
    expect(
      'bob joins (team Reds)',
      await call('POST', `/games/${gid}/players`, {
        token: T.bob,
        body: { playerName: 'Bob', playInTeams: true, joinTeam: false, teamName: 'Reds', teamColor: '#ff0000' },
      })
    );
    expect(
      'charlie joins (team Blues)',
      await call('POST', `/games/${gid}/players`, {
        token: T.charlie,
        body: { playerName: 'Charlie', playInTeams: true, joinTeam: false, teamName: 'Blues', teamColor: '#0000ff' },
      })
    );
    expect('bob ready', await call('PUT', `/games/${gid}/players/bob`, { token: T.bob, body: { action: 'ready' } }));
    expect(
      'charlie ready',
      await call('PUT', `/games/${gid}/players/charlie`, { token: T.charlie, body: { action: 'ready' } })
    );

    // --- game_start → game_home → round_start → question_active ---
    expect('game start', await call('PUT', `/games/${gid}`, { body: { action: 'start' } }));
    expect('round select', await call('PUT', `/games/${gid}/rounds/${rid}`, { body: { action: 'select' } }));
    expect('round start', await call('PUT', `/games/${gid}/rounds/${rid}`, { body: { action: 'start' } }));

    const q1 = (await call('GET', `/games/${gid}`)).data.currentQuestion || `${type}_1`;
    const base1 = `/games/${gid}/rounds/${rid}/questions/${q1}`;
    expect('GET playable as alice (organizer, full)', await call('GET', base1, { query: { type } }), [200]);
    expect(
      'GET playable as bob (player, redacted)',
      await call('GET', base1, { token: T.bob, query: { type } }),
      [200]
    );
    expect('addSound', await call('POST', `/games/${gid}/sounds`, { body: { filename: 'pop' } }));
    expect('timer start', await call('PUT', `/games/${gid}/timer`, { body: { action: 'start' } }));
    expect('reset (stays question_active)', await call('POST', base1, { body: { action: 'reset' } }));

    if (type === 'mcq') {
      // select_choice is chooser-team only; the shuffle picks one of the two, so
      // try bob first and fall back to charlie — exactly one is the chooser.
      const first = await call('POST', base1, { token: T.bob, body: { action: 'select_choice', choiceIdx: 0 } });
      const res =
        first.status < 400
          ? first
          : await call('POST', base1, { token: T.charlie, body: { action: 'select_choice', choiceIdx: 1 } });
      expect('select_choice {choiceIdx} (chooser team)', res);
    } else {
      expect(
        'add_player_to_buzzer as bob',
        await call('POST', base1, { token: T.bob, body: { action: 'add_player_to_buzzer' } })
      );
      expect(
        'add_player_to_buzzer as charlie',
        await call('POST', base1, { token: T.charlie, body: { action: 'add_player_to_buzzer' } })
      );
      expect(
        'handle_buzzer_head_changed {playerId}',
        await call('POST', base1, { body: { action: 'handle_buzzer_head_changed', playerId: 'bob' } })
      );
      expect(
        'invalidate_answer {playerId} (re-arms)',
        await call('POST', base1, { body: { action: 'invalidate_answer', playerId: 'bob' } })
      );
      expect('clear_buzzer', await call('POST', base1, { body: { action: 'clear_buzzer' } }));
      expect(
        'add_player_to_buzzer as charlie (re-buzz)',
        await call('POST', base1, { token: T.charlie, body: { action: 'add_player_to_buzzer' } })
      );
      expect(
        'validate_answer {playerId} (ends question)',
        await call('POST', base1, { body: { action: 'validate_answer', playerId: 'charlie' } })
      );
    }

    // question_end → advance to the second question → countdown_end it → round_end
    expect(
      'round question_end (advance)',
      await call('PUT', `/games/${gid}/rounds/${rid}`, { body: { action: 'question_end' } })
    );
    const q2 = (await call('GET', `/games/${gid}`)).data.currentQuestion;
    if (q2 && q2 !== q1) {
      const base2 = `/games/${gid}/rounds/${rid}/questions/${q2}`;
      expect('countdown_end', await call('POST', base2, { body: { action: 'countdown_end' } }));
      expect(
        'round question_end (end round)',
        await call('PUT', `/games/${gid}/rounds/${rid}`, { body: { action: 'question_end' } })
      );
    }
    expect('game end', await call('PUT', `/games/${gid}`, { body: { action: 'end' } }));
  }

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  if (failures.length) {
    console.log('\nFAILURES:');
    for (const f of failures) console.log(`  ${f.label} → ${f.res.status}  ${JSON.stringify(f.res.data)}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\nSMOKE ABORTED:', e.message);
  process.exit(1);
});
