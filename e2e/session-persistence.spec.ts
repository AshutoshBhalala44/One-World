import { test, expect, type BrowserContext, type BrowserType } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

/**
 * End-to-end flow:
 *   1. Seed a Supabase session into localStorage (the "sign in" step —
 *      we bypass the real phone OTP and inject a session directly,
 *      since the app uses `persistSession: true` with localStorage).
 *   2. Fully close the browser context (simulating the user closing
 *      the tab / quitting the browser).
 *   3. Re-open a new context that reuses the saved storage state,
 *      and assert the user is still signed in — no redirect to /auth,
 *      no "Sign In" button, and the Supabase auth token is still
 *      present in localStorage.
 *
 * This guards against any future regression where the app inadvertently
 * clears the session on tab close (e.g. via `signOut`, `beforeunload`,
 * a switch to `sessionStorage`, or disabling `persistSession`).
 */

// Supabase storage key is `sb-<project-ref>-auth-token`.
const PROJECT_REF = "uwfuunulynmiyskvgutp";
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

// Far-future expiry so the client treats the session as valid.
const ONE_YEAR_FROM_NOW = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;

const FAKE_USER_ID = "00000000-0000-4000-8000-000000000001";

const FAKE_SESSION = {
  access_token: "fake-access-token-for-persistence-test",
  token_type: "bearer",
  expires_in: 60 * 60 * 24 * 365,
  expires_at: ONE_YEAR_FROM_NOW,
  refresh_token: "fake-refresh-token-for-persistence-test",
  user: {
    id: FAKE_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "",
    phone: "+10000000000",
    app_metadata: { provider: "phone", providers: ["phone"] },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const storageStatePath = path.join(
  os.tmpdir(),
  `one-world-session-${Date.now()}.json`,
);

test.afterAll(() => {
  if (fs.existsSync(storageStatePath)) fs.unlinkSync(storageStatePath);
});

async function isSignedInOnHome(context: BrowserContext, baseURL: string) {
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // Give the auth listener a tick to hydrate the session from localStorage.
  await page.waitForTimeout(500);

  const url = new URL(page.url());
  const onAuthRoute = url.pathname.startsWith("/auth");

  const stored = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    STORAGE_KEY,
  );

  // Header swaps "Sign In" -> "Sign Out" (in an alert dialog trigger)
  // once a session is present.
  const signInVisible = await page
    .getByRole("link", { name: /sign in/i })
    .first()
    .isVisible()
    .catch(() => false);

  await page.close();
  return { onAuthRoute, stored, signInVisible, baseURL };
}

test("user stays signed in after closing and reopening the browser", async ({ playwright }, testInfo) => {
  const browserName = (testInfo.project.use.browserName ?? "chromium") as
    | "chromium"
    | "webkit"
    | "firefox";
  const browserType: BrowserType = playwright[browserName];
  const browser = await browserType.launch();

  // --- Step 1: "sign in" by seeding a session, then save storage state.
  const seedContext = await browser.newContext();
  const seedPage = await seedContext.newPage();
  await seedPage.goto("/", { waitUntil: "domcontentloaded" });

  await seedPage.evaluate(
    ({ key, session }) => {
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    { key: STORAGE_KEY, session: FAKE_SESSION },
  );

  // Reload so the AuthProvider picks up the seeded session.
  await seedPage.reload({ waitUntil: "domcontentloaded" });
  await seedPage.waitForTimeout(500);

  const seededValue = await seedPage.evaluate(
    (key) => window.localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(seededValue, "session should be seeded into localStorage").not.toBeNull();

  await seedContext.storageState({ path: storageStatePath });

  // --- Step 2: fully close the browser (tab + context + browser).
  await seedPage.close();
  await seedContext.close();
  await browser.close();

  // --- Step 3: reopen a fresh browser with the saved storage state
  // and confirm the session survives.
  const reopened = await browserType.launch();
  const restoredContext = await reopened.newContext({
    storageState: storageStatePath,
  });

  const result = await isSignedInOnHome(restoredContext, "/");

  expect(result.stored, "auth token must persist across browser close").not.toBeNull();
  expect(result.onAuthRoute, "user must not be bounced to /auth").toBe(false);
  expect(result.signInVisible, "Sign In button must not be shown when signed in").toBe(false);

  await restoredContext.close();
  await reopened.close();
});
