# Everline

**Every life is a story worth keeping.**

Everline is a collaborative life-story platform. A family builds one person's story as a chronological timeline, from the day they were born through childhood, work, marriage, family, ordinary days and later life. Relatives contribute photographs, written memories, video and voice recordings; a designated story keeper approves each contribution before it appears. It works for people who are still living as well as for those who have died.

This repository is the first release: a working Next.js application with a Supabase backend, Row Level Security, file storage and a clearly labelled local demo mode.

---

## Contents

- [What works](#what-works)
- [Run it locally (demo mode)](#run-it-locally-demo-mode)
- [Connect Supabase](#connect-supabase)
- [Deploy to Vercel](#deploy-to-vercel)
- [Architecture](#architecture)
- [Security model](#security-model)
- [Testing](#testing)
- [Design system](#design-system)
- [Known limitations and next steps](#known-limitations-and-next-steps)

---

## What works

| Area | In this release |
| --- | --- |
| Accounts | Email and password sign-up and sign-in, email confirmation, password reset, display name |
| Stories | Create a story for a living or remembered person, partial dates ("around 1962"), introduction, cover photograph, delete (keeper only) |
| Timeline | Chapters of life, moments placed automatically by date, age at each moment, milestones, sticky year markers, scroll-linked lifeline, chapter navigation |
| Moments | Title, partial date, place, people, written story, photographs, video, audio, in-browser voice recording, captions and ordering |
| Collaboration | Roles (story keeper, editor, contributor, reader), private invitation links bound to an email address, role changes, removal, leaving |
| Review | Contributions wait for approval; publish, ask for changes with a note, or decline; contributors see the status and notes on their work; review history is logged in the database |
| Privacy | Stories are visible only to members; media is served from a private bucket through short-lived signed URLs |
| Public pages | Landing page and a public, read-only example story |

Not built yet (and not presented as working anywhere in the interface): sending invitation emails (keepers copy and send the link themselves), printed books and keepsakes, archive export, billing.

---

## Run it locally (demo mode)

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Without Supabase credentials Everline starts in **demo mode**:

- A banner on every page says so.
- Data lives in server memory, seeded with the fictional Ellison family, and resets when the server restarts.
- Sign-in lets you step into the family as Ruth (story keeper), David (editor), Tom (contributor) or Sandra (reader of Walter's story), or create a demo account.
- Uploads (up to 12 MB) are kept in memory. Nothing is emailed.

Demo mode is for evaluation only. Anyone can choose any demo identity, by design, so never use it with real family material.

The demo photographs in `public/demo` are generated procedurally (`npm run media:demo`, requires Python 3 with Pillow and NumPy) rather than taken from stock libraries.

---

## Connect Supabase

1. **Create a project** at [supabase.com](https://supabase.com).

2. **Apply the migrations** (they create the schema, policies, triggers and the private `story-media` bucket):

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

   Or paste the files in `supabase/migrations/` into the SQL editor, in filename order.

3. **Configure Auth** in the Supabase dashboard (Authentication > URL Configuration):
   - Site URL: your deployed URL, for example `https://everline.example.com`
   - Redirect URLs: `https://everline.example.com/auth/callback` (and `http://localhost:3000/auth/callback` for local work)
   - Keep email confirmations on for production.
   - Set the minimum password length to 10 to match the app's own rule.

4. **Set environment variables** in `.env.local` (see `.env.example`):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

5. **Check storage limits.** The bucket allows files up to 200 MB, but your Supabase plan's global upload limit may be lower (50 MB on the free plan). Raise it under Storage settings if you want large videos.

The application never uses the service-role key. Every query runs as the signed-in person, so Row Level Security is always in force.

### Local Supabase (optional)

With Docker installed, `npx supabase start` runs the whole stack locally using `supabase/config.toml`, and applies the migrations automatically.

---

## Deploy to Vercel

1. Push this repository to GitHub and import it in Vercel.
2. Add the environment variables from step 4 above, with `NEXT_PUBLIC_SITE_URL` set to your production URL.
3. Deploy. The proxy (`src/proxy.ts`) refreshes Supabase sessions on each request.

If you deploy without Supabase variables the site runs in demo mode, which is useful for previews but resets on every cold start.

---

## Architecture

```
src/
  app/                    Routes (Next.js App Router)
    (marketing)/          Landing page and public example story
    (auth)/               Sign in, sign up, password reset, auth actions
    (app)/                Signed-in area: library, story pages, settings
      s/[slug]/actions.ts Server actions for everything inside a story
    api/                  Upload endpoints (and demo-only media serving)
    invite/[token]/       Invitation preview and acceptance
  components/             Presentation only: ui primitives, timeline, forms
  lib/
    domain/               Types, dates, names, permission rules (pure, no I/O)
    services/             Application logic: every rule is checked here
    data/
      repository.ts       The persistence contract
      supabase/           Production implementation (runs as the user, RLS applies)
      demo/               In-memory implementation and seed for demo mode
    auth/session.ts       Current viewer and repository for the request
    validation.ts         Zod schemas for every form
supabase/
  migrations/             Schema, RLS policies, triggers, storage bucket
  tests/                  RLS tests that run the real migrations in PGlite
```

Layers only call downwards: pages and actions call services; services check permissions and call the repository; the repository talks to Supabase or the demo store. Components never import data access.

**Timeline placement.** Chapters are defined by the year they begin. A moment belongs to the latest chapter starting on or before its year, so contributors never have to file anything.

**Dates.** `PartialDate` holds a year, optional month and day, and a "circa" flag. Ages are computed from the birth date and marked approximate when precision is missing.

**Uploads.** The browser asks `/api/stories/:id/uploads` for a ticket (permission, type and size are checked), sends the bytes straight to Supabase Storage with a signed upload URL, then confirms with `/uploads/complete`, which verifies the object exists and records it. Only media IDs are submitted with the moment form, and the service checks each one belongs to the story and the person.

**Rendering.** Cache Components is switched off: almost every page depends on who is signed in, so request-time rendering keeps authorisation explicit and simple.

---

## Security model

Defence in depth, with the database as the final authority:

1. **Postgres Row Level Security** on every table. Membership is read through `security definer` helper functions (`story_role_of`, `has_story_role`) to avoid recursive policies.
2. **Column guards in triggers.** A contributor can edit their own unpublished moment, but the `guard_moment_write` trigger forces it back to `pending` and stops them changing status, milestones or review fields, whatever the request contains.
3. **Storage policies** mirror moment visibility: a photograph is readable only by someone who can read its row in `media`.
4. **Invitations** store only a SHA-256 hash of a 256-bit token. Acceptance runs in a `security definer` function that checks expiry, revocation and that the signed-in email matches the invited address.
5. **Application services** re-check every permission before calling the database, and server actions re-establish the viewer and story from the session on each call.
6. **Other measures:** `getClaims()` verifies the session JWT; redirect targets are restricted to same-site paths; upload endpoints reject cross-origin requests; security headers are set in `next.config.ts`; non-members get a 404, not a 403, so story existence isn't revealed.

The RLS test suite caught one real bug during development (a missing role ranked as "reader"), which is why `story_role_rank` is `strict`.

---

## Testing

```bash
npm run typecheck   # TypeScript, strict mode
npm run lint        # ESLint (Next.js core web vitals + TypeScript rules)
npm test            # Unit, service and database tests
npm run test:db     # Only the RLS tests
```

- `src/lib/domain/domain.test.ts`: dates, ages and the permission matrix.
- `src/lib/services/services.test.ts`: the full contribute, review, edit and invite loops against the demo repository.
- `supabase/tests/rls.test.ts`: runs the real migrations in an embedded Postgres (PGlite) with stand-ins for Supabase's `auth` and `storage` schemas, then checks what each role can read and write. No Docker needed.

---

## Design system

Everline is meant to feel like an editorial biography or a documentary, not a dashboard.

- **Palette** from the photographic darkroom, defined as CSS variables in `src/app/globals.css` with a dark scheme: baryta paper `#eef0ec`, graphite ink `#1f2629`, cyanotype blue `#24507a` (the lifeline and links), gold toner `#84601c` (milestones only), and a deep cyanotype night `#1b2a35` for photographic surfaces.
- **Type:** Newsreader (variable, with optical sizes) for names, years and stories; Schibsted Grotesk for the interface. Years use old-style figures.
- **The lifeline** is the one signature element: a continuous rule that fills with ink as you read, with large year numerals in a sticky gutter. Motion is limited to that, a single arrival sequence on story pages, and responses to what people do.
- Accessibility: semantic landmarks, labelled controls, visible focus, reduced-motion support, and text colours checked against WCAG AA with axe.

---

## Known limitations and next steps

- **Invitation emails** are not sent; keepers copy the link. Add an email provider (for example Resend or Supabase SMTP with a custom template) in `inviteAction`.
- **Image processing:** originals are served as uploaded. Add resized renditions (Supabase image transformations or a background job) and HEIC conversion for browsers that can't display it.
- **Orphaned uploads:** files uploaded but never attached to a moment remain in storage. A scheduled clean-up of unattached `media` older than a day is the fix.
- **Rate limiting** on auth and upload endpoints should be added at the edge (Vercel WAF or similar) before launch.
- **Content Security Policy:** basic security headers are set; a nonce-based CSP is the next hardening step.
- **Commercial features:** printed life-story books, albums, archive export and billing are not started. The data model (ordered chapters, dated moments, captioned media with dimensions) was designed with book layout in mind.
