# AI workflow note

## Tools used

**Claude Code** (Sonnet) was the primary and only AI tool for this
assignment — used as an agentic pair programmer with direct shell, file,
and browser-automation access, not just for autocomplete or Q&A.

## Where AI materially sped things up

- **Scaffolding and boilerplate.** Generating the Next.js project, the
  Prisma schema, the Zod-validated API routes, and repetitive small client
  components (login button, upload button, delete button) took minutes
  instead of the usual copy-paste-and-adapt cycle. This is where AI helps
  most and where I trust it most — the failure mode (a typo, a wrong status
  code) is cheap to catch in review.
- **Working through two real toolchain breakages.** `create-next-app` and
  `prisma init` pulled in current-latest versions that didn't fit together:
  Prisma 7's new config format (no more `url` in `schema.prisma`, requires a
  driver adapter) broke `migrate dev` immediately, and Next.js 16 has
  renamed `middleware.ts` to `proxy.ts` (the old convention still half-works
  but warns). Claude Code diagnosed both from the actual error output,
  identified them as version-mismatch issues rather than logic bugs, and
  fixed them (pinning Prisma to the last stable 6.x line; renaming to
  `proxy.ts` and the `proxy()` export) in a couple of minutes rather than
  me manually diffing changelogs.
- **End-to-end verification loop.** Rather than "looks right, ship it,"
  Claude Code drove the actual app: curl-based multi-user API walkthroughs
  (login as Alice, share with Bob, log in as Bob, confirm permission
  boundaries) and a headless-Chromium (Playwright) pass that clicked through
  login → dashboard → editor → share dialog → logout → second user, taking
  screenshots at each step. That loop is what caught the two real bugs
  described below — neither would have surfaced from reading the code.

## What AI-generated output I changed or rejected

- **Geist font via `next/font/google`** (the `create-next-app` default) —
  removed in favor of a system font stack. It's an unnecessary network
  dependency at build time for an app with no real typographic requirement,
  and it added risk with no product benefit.
- **A duplicate Tiptap extension.** I had the editor explicitly load
  `@tiptap/extension-underline` alongside `StarterKit` — reasonable-looking
  code that runs without error. The headless-browser pass surfaced a console
  warning ("Duplicate extension names found: ['underline']"), which traced
  back to Tiptap v3's `StarterKit` already bundling `Underline` by default.
  Removed the redundant import and the unused package dependency rather than
  leaving a silently-harmless-but-wrong duplicate in place.
- **A dashboard header layout bug.** The header used `items-center` to
  align the title block against the button row; visually this crowded the
  "Supports .txt, .md, .docx" upload hint text right up against the
  "Signed in as…" subtitle. Caught from an actual screenshot, not from
  reading the Tailwind classes (which looked fine in isolation) — fixed by
  switching to `items-start`.
- **Prisma's auto-generated AI-agent skill files.** `prisma init` on the
  Prisma 7 CLI scaffolded `.agents/`, `.claude/`, and `.windsurf/` directories
  full of Prisma CLI/API reference docs (not project code) plus a
  `skills-lock.json`. Deleted before committing — they're tooling noise, not
  something a reviewer of this project needs to see.

## How I verified correctness, UX quality, and implementation reliability

1. **Unit tests** (`npx vitest run`) for the one piece of logic where a bug
   would be a real security/product problem: `canAccessDocument` — owner,
   view-share, edit-share, no-relation, and no-user-signed-in cases all
   asserted explicitly.
2. **Multi-user API walkthrough via curl**, simulating the exact scenario a
   reviewer would run manually: log in as Alice, create a document, upload
   a `.md` file, share a document with Bob (edit) and confirm an unknown
   email is rejected, log in as Bob, confirm his dashboard shows both shared
   documents with the *correct* permission each, confirm he can edit the
   EDIT-shared doc but is rejected (403) editing the VIEW-shared one,
   confirm he's rejected (403) opening a document never shared with him at
   all, confirm an unauthenticated request gets 401, and confirm Bob's edit
   is visible back on Alice's side (persistence across users/requests).
3. **Real browser verification**, not just curl — a headless Chromium
   session (Playwright, since `chromium-cli` wasn't available in this
   environment) driven through the actual UI: login page renders the
   seeded users, dashboard renders both document lists, the editor's
   toolbar and formatted content render correctly, the share dialog loads
   and displays existing shares, and a VIEW-only document correctly hides
   the editing toolbar. Console/page-error listeners were attached
   throughout and checked for errors after each interaction.
4. **Production smoke test against the live deployment** — after deploying,
   re-ran the login → create-document flow via curl directly against the
   Vercel URL to confirm it was actually reading/writing the production
   Supabase database (not silently falling back to a local placeholder),
   plus a second headless-browser pass against the live URL.
5. **`npm run build`** run clean (no type errors, no warnings) before every
   deploy, not just `next dev` looking fine.

The common thread: I treated "the code looks right" and "I watched it run
and checked the output" as two different bars, and didn't call something
done on the first one alone.
