/**
 * Manual smoke test for src/middleware.ts (route guards).
 *
 * Verifies:
 *   1. Unauthenticated requests to protected routes (including "/about") are
 *      redirected to sign-in with the right callbackUrl, while "/auth/signin"
 *      itself stays reachable (no redirect loop).
 *   2. "/join/*" is NOT gated by middleware (reachable by anyone, e.g. someone
 *      scanning a QR code), but the page itself still redirects unauthenticated
 *      visitors to sign-in with itself as the callback.
 *   3. A guest account can reach "/" (with the reduced UI) but is bounced
 *      back to "/" when it tries "/edit" or "/submit/*".
 *   4. A regular (non-guest) account keeps full access to "/edit" and "/submit/*".
 *
 * This is not part of the test suite / CI — just a script to re-run by hand
 * after touching middleware.ts or the auth/guest guarding logic.
 *
 * Usage:
 *   1. npm run dev:emulators
 *   2. node scripts/verify-route-guards.mjs
 *
 * Requires the `playwright` package with Chromium installed
 * (npx playwright install chromium) - it's not a project dependency,
 * just a local tool for running this script.
 *
 * Assumes the seeded emulator data (emulator-data/) is present, which
 * includes a joinable game at /join/game_1.
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const SEEDED_GAME_ID = 'game_1';

// Cold Turbopack compiles can take several seconds on the first hit to a
// route, so navigation waits use a generous timeout keyed off the URL
// actually changing rather than a fixed sleep.
const NAV_TIMEOUT = 20000;

let failures = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ✅ ${label}`);
  } else {
    console.log(`  ❌ ${label}${detail ? ` (${detail})` : ''}`);
    failures++;
  }
}

async function verifyUnauthenticatedRedirects() {
  console.log('\n1. Unauthenticated requests (middleware-gated routes)');

  for (const path of ['/', '/about', '/edit', '/submit/basic']) {
    const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
    const location = res.headers.get('location') ?? '';
    const expectedCallback = `callbackUrl=${encodeURIComponent(path)}`;
    check(
      `${path} -> redirected to sign-in with callbackUrl`,
      res.status === 307 && location.includes('/api/auth/signin') && location.includes(expectedCallback),
      `got ${res.status} ${location}`
    );
  }

  const signinRes = await fetch(`${BASE_URL}/auth/signin`, { redirect: 'manual' });
  check('/auth/signin stays reachable (no redirect loop)', signinRes.status === 200, `got ${signinRes.status}`);
}

async function verifyJoinIsUngated(browser) {
  console.log('\n2. "/join/*" is not gated by middleware');

  const res = await fetch(`${BASE_URL}/join/${SEEDED_GAME_ID}`, { redirect: 'manual' });
  check('/join/<id> reaches the app directly (no middleware redirect)', res.status === 200, `got ${res.status}`);

  const page = await (await browser.newContext()).newPage();
  await page.goto(`${BASE_URL}/join/${SEEDED_GAME_ID}`, { timeout: NAV_TIMEOUT });
  await page.waitForURL((url) => url.pathname === '/auth/signin', { timeout: NAV_TIMEOUT });
  const callback = new URL(page.url()).searchParams.get('callbackUrl');
  check(
    'unauthenticated visitor is redirected to sign-in by the page itself, with itself as callback',
    callback === `/join/${SEEDED_GAME_ID}`,
    `ended at ${page.url()}`
  );
  await page.close();
}

async function signInAsGuest(page) {
  await page.goto(`${BASE_URL}/auth/signin?callbackUrl=${encodeURIComponent('/join/does-not-exist')}`);
  await page.waitForSelector('input[placeholder="Mon pseudo"]');
  await page.fill('input[placeholder="Mon pseudo"]', 'GuestTester');
  await page.click('button:has-text("Jouer en invité")');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/signin'), { timeout: NAV_TIMEOUT });
}

async function signInAsDevUser(page, name = 'alice') {
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.waitForSelector('input[placeholder="alice"]');
  await page.fill('input[placeholder="alice"]', name);
  await page.click('button:has-text("Se connecter")');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/signin'), { timeout: NAV_TIMEOUT });
}

async function gotoAndSettle(page, path) {
  await page.goto(`${BASE_URL}${path}`, { timeout: NAV_TIMEOUT });
  // page.goto() already follows server-side (middleware) redirects, but give
  // client-side effects (e.g. useSession-driven renders) a moment to settle.
  await page.waitForLoadState('load', { timeout: NAV_TIMEOUT });
}

async function verifyGuestGuarding(browser) {
  console.log('\n3. Guest account');
  const page = await (await browser.newContext()).newPage();

  await signInAsGuest(page);

  await gotoAndSettle(page, '/');
  check('guest can reach "/"', page.url() === `${BASE_URL}/`, `ended at ${page.url()}`);

  await gotoAndSettle(page, '/edit');
  check('guest is bounced from "/edit" back to "/"', page.url() === `${BASE_URL}/`, `ended at ${page.url()}`);

  await gotoAndSettle(page, '/submit/basic');
  check('guest is bounced from "/submit/basic" back to "/"', page.url() === `${BASE_URL}/`, `ended at ${page.url()}`);

  await page.close();
}

async function verifyNonGuestAccess(browser) {
  console.log('\n4. Regular (non-guest) account');
  const page = await (await browser.newContext()).newPage();

  await signInAsDevUser(page, 'alice');

  await gotoAndSettle(page, '/edit');
  check('alice can reach "/edit"', page.url() === `${BASE_URL}/edit`, `ended at ${page.url()}`);

  await gotoAndSettle(page, '/submit/basic');
  check('alice can reach "/submit/basic"', page.url() === `${BASE_URL}/submit/basic`, `ended at ${page.url()}`);

  await page.close();
}

async function main() {
  try {
    await fetch(BASE_URL);
  } catch {
    console.error(`Cannot reach ${BASE_URL}. Start the app first: npm run dev:emulators`);
    process.exit(1);
  }

  await verifyUnauthenticatedRedirects();

  const browser = await chromium.launch();
  await verifyJoinIsUngated(browser);
  await verifyGuestGuarding(browser);
  await verifyNonGuestAccess(browser);
  await browser.close();

  console.log(failures === 0 ? '\n✅ All route guard checks passed!' : `\n❌ ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
