# New `/welcome` Landing Page with Swipe-to-Sign-In

## Goal
Create a standalone marketing landing page at `/welcome` that introduces One World and uses a swipe-to-unlock control to send visitors to the sign-in page. The current home (`/`) keeps everything it has today except the top hero copy, which moves entirely to the new landing page.

## Routes
- `/welcome` — new full marketing landing page (public, works for signed-in and signed-out users).
- `/` — existing app home, unchanged in functionality but with the `<HeroSection />` removed from the top.
- `/auth` — unchanged. Swipe target.
- No auto-redirect. Signed-in users who visit `/welcome` still see it; the swipe simply takes them to `/auth` (existing auth page already routes signed-in users back).

## Landing page structure (`/welcome`)
A scrollable, full marketing page in the project's deep-navy + gold editorial style:

1. **Hero band** — uses the existing hero globe image and gradient. Contains:
   - "Every voice counts. No manipulation." headline (current hero copy).
   - Tagline: "The world's most transparent polling platform…".
   - The 3 badges (190+ countries, real-time, tamper-proof).
   - **Swipe-to-sign-in control** centered below.
2. **How it works** — 3 short steps: Verify your phone → Complete the Weekly Challenge → Vote in Daily Challenges.
3. **Why One World** — 3–4 feature cards: transparent country breakdowns, one vote per person, AI-curated challenges, real-time global results.
4. **Final CTA** — large repeat of the swipe control + a plain "Sign in" link as a fallback.
5. **Footer** — same footer line as the current home.

All copy uses "Challenge" terminology (never "poll").

## Swipe-to-sign-in control
A new `SwipeToSignIn` component:
- Pill-shaped track with a draggable circular thumb on the left and label "Swipe to sign in →".
- **Desktop:** mouse-drag the thumb across the track.
- **Mobile/touch:** touch-drag the thumb across the track.
- When the thumb passes ~85% of the track width, the control locks, shows a brief "Unlocking…" state, then `navigate("/auth")`.
- If released before the threshold, the thumb springs back.
- Implemented with framer-motion (`drag="x"`, `dragConstraints`, `onDragEnd`) — already a project dependency.
- Keyboard fallback: focusable; Enter/Space navigates to `/auth` so it remains accessible.
- Subtle gold glow on the thumb to match the brand.

## Changes to existing files
- **`src/App.tsx`** — add `<Route path="/welcome" element={<Welcome />} />` above the catch-all.
- **`src/pages/Index.tsx`** — remove `<HeroSection />` from the render. Everything else (Header, WeeklyChallenge gating, Tabs for Today/Responses/Submit, footer, auto-scroll) stays exactly as is.
- **`src/components/Header.tsx`** — no functional change; the logo already routes to `/`. (The existing tagline "The world's voice, unfiltered." in the header stays.)

## New files
- `src/pages/Welcome.tsx` — the landing page described above. Reuses `Header`, `HeroSection` styling tokens, and the hero globe image. Includes SEO basics: `<title>` ≤60 chars, meta description ≤160 chars, single H1, semantic sections, alt text on the hero image.
- `src/components/SwipeToSignIn.tsx` — the swipe control.

## Out of scope
- No changes to auth flow, database, weekly/daily challenge logic, or admin panel.
- No auto-redirect behavior based on auth state.
- No removal of the `/` route or change to where the logo links.

## Open question (only if you want to change the answer)
You chose "Landing at /welcome only," which means visiting `/` still shows the app home directly. New visitors will only see the landing page if they navigate to `/welcome`. If you'd like `/welcome` to also be what people see when they first arrive (e.g., by linking it from the Header or making it the default for signed-out users), say the word and I'll fold that into the implementation.
