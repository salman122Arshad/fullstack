# Architecture note

## What I prioritized, and why

The brief was explicit that depth in a few areas beats shallow coverage
everywhere, so I picked four things to get right and consciously
under-invested elsewhere:

1. **Correct, tested authorization logic for sharing.** Access control is the
   one thing in this app that's easy to get subtly wrong and embarrassing to
   get wrong in a reviewer's hands (e.g. a "view" share that can secretly
   edit, or a stranger who can open someone else's document by guessing an
   id). I isolated the entire rule into one pure function,
   `canAccessDocument` (`src/lib/access.ts`), and every API route calls it
   rather than re-deriving permission logic inline. It's the one thing in
   this codebase with a dedicated unit test suite.
2. **A rich-text editing experience that actually feels coherent**, not a
   `<textarea>` with a bold button bolted on. Tiptap gives real ProseMirror
   document semantics (so "Heading 2" and "bulleted list" are structural,
   not just inline styling), which matters for a "does this feel like a real
   editor" evaluation.
3. **A file-import path that's genuinely useful**, not a toy. Uploading a
   `.txt`/`.md`/`.docx` produces a real editable document with structure
   preserved as far as each format allows (markdown headings/lists become
   real Tiptap nodes; `.docx` goes through `mammoth` for HTML extraction)
   rather than dumping raw text into one paragraph.
4. **A deployment a reviewer can actually open**, on infrastructure that
   costs nothing to try. That constraint shaped several implementation
   choices below (see "Vercel + Supabase specifics").

## Key tradeoffs

**Single Next.js app instead of a separate frontend/backend.** The original
prompt leaned toward a more traditional split (I'd considered a NestJS API),
but a single Next.js project with Route Handlers deploys as one Vercel
project with no serverless-adapter workarounds, and for an app of this size
a separate API server buys isolation the project doesn't need yet. If this
grew (more services, independent scaling, a mobile client), splitting the
API out would be the natural next step — the Route Handlers are already
thin, mostly validation + a Prisma call, so extracting them wouldn't require
redesigning the domain logic.

**Mocked auth (seeded users, signed cookie, no passwords).** The assignment
explicitly allows this, and building real auth (password hashing, email
verification, session rotation) would have consumed a large share of the
timebox for a part of the product nobody asked to see exercised. The session
cookie is still HMAC-signed (not just a plain user id) so it isn't trivially
forgeable, which felt like the right amount of rigor for a mocked system:
enough that the *shape* of a real auth boundary is present, not so much that
it pretends to be production-grade security.

**Two-tier sharing (view / edit), not granular permissions.** Real-world doc
sharing has all sorts of variations (comment-only, expiring links, link
sharing vs. named-user sharing). I picked the two permissions that
demonstrate the core mechanic — an owner, a grant, and a visible distinction
between "mine" and "shared with me" — and left more elaborate permission
models as a stated stretch item rather than half-building several tiers.

**HTML-as-storage for document content.** Tiptap's `getHTML()` output is
stored directly in a `contentHtml` text column and re-hydrated into the
editor on load. This is the simplest thing that (a) round-trips perfectly
through Tiptap, (b) is trivial to render read-only for a view-only share
without a second rendering path, and (c) is human-inspectable in the
database for debugging. The tradeoff is that it's Tiptap-shaped HTML, not a
portable format — swapping editors later would need a migration step. For
this scope, that's the right trade.

**Autosave over an explicit save button.** A ~700ms debounce after the last
keystroke patches `contentHtml`; there's a status indicator ("Saving…" /
"Saved" / error) rather than a save action the user has to remember to
trigger. This matches how Google Docs and most modern editors behave and
avoids a whole class of "I forgot to save" bugs, at the cost of more network
chatter than a manual save would produce — acceptable for this scale.

**Vercel + Supabase specifics.** Vercel serverless functions have an
ephemeral filesystem, so SQLite (the simplest local option) wasn't viable in
production — hence Postgres via Supabase's free tier from the start, rather
than building against SQLite locally and discovering a mismatch at deploy
time. The Prisma schema reads `DATABASE_POSTGRES_PRISMA_URL` (pooled, for
runtime queries) and `DATABASE_POSTGRES_URL_NON_POOLING` (direct, for
`prisma migrate`) because those are the exact names Vercel's
Supabase-Marketplace integration injects when connected with a `DATABASE`
prefix — matching the platform's naming rather than introducing an
extra layer of variable-renaming/aliasing.

## Stretch: export to Markdown / PDF

The one optional stretch item I added (per the brief: "add one small
enhancement... do not sacrifice core functionality"). Both export paths are
in `ExportMenu.tsx`, next to Share, available to anyone who can view the
document (not owner-gated, since exporting doesn't mutate anything):

- **Markdown** — `turndown` converts the Tiptap HTML to Markdown client-side
  (`src/lib/exportMarkdown.ts`) and triggers a browser download. No server
  round-trip needed since the content is already in the browser. Markdown
  has no native underline syntax, so a custom Turndown rule preserves it as
  inline `<u>` (most Markdown renderers pass raw HTML through) rather than
  silently dropping that formatting.
- **PDF** — deliberately *not* a server-side rendering pipeline
  (Puppeteer/etc. is real infrastructure for a "small enhancement"). Instead,
  a `@media print` stylesheet hides everything except the title and content,
  and the button calls the browser's native `window.print()` → "Save as
  PDF." Zero new server surface, works in every browser, and is the same
  approach Notion/Google Docs' own print-to-PDF paths use under the hood.

This was chosen over the other stretch options (version history, real-time
collaboration, comments, granular permissions) specifically because it's
self-contained — no new DB table, no migration, no change to the access-
control surface I was most careful about getting right elsewhere.

## What I deliberately did not build

- **Real-time collaboration** (multi-cursor, live co-editing). This is the
  single most valuable stretch feature but also the biggest time sink —
  correct conflict resolution (CRDT/OT) is its own project. Out of scope for
  this timebox; noted as the first thing I'd build next.
- **Comments / suggestion mode, document version history.** Both explicitly
  listed as optional stretch work in the brief; skipped in favor of the
  export feature above to keep to *one* stretch addition, per the brief's
  own instruction not to spread stretch effort thin.
- **Granular/role-based permissions beyond view/edit.**
- **Revoking/rotating the mocked-auth session** beyond a logout that clears
  the cookie — there's no "sign out everywhere" or session listing, since
  there's no real login to secure in the first place.

## What I'd build next with 2-4 more hours

1. **Optimistic UI + conflict handling for concurrent edits.** Right now two
   people with EDIT access editing the same document simultaneously will
   silently overwrite each other's autosave (last write wins). A version
   counter with a "this document changed, reload?" prompt would be a cheap
   improvement short of full real-time collaboration.
2. **Document version history** (even a simple "snapshot on each save,
   list + restore" rather than granular diffs) — the stretch item that
   pairs best with the autosave model already in place, and the next stretch
   item I'd pick up after export.
3. **Better `.docx` fidelity** — mammoth's default conversion drops some
   structure (tables in particular); a style-mapping config would recover
   more of it.
