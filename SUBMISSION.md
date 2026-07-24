# Submission

## What's included in this folder

- **Source code** — the full Next.js project (this repository).
- `README.md` — local setup/run instructions, feature list, supported file
  types, seeded test accounts, screenshots.
- `ARCHITECTURE.md` — what was prioritized, key tradeoffs, what was
  deliberately cut, what's next.
- `AI_WORKFLOW.md` — AI tools used, where they helped, what AI output was
  changed/rejected, how correctness was verified.
- `SUBMISSION.md` — this file.
- `docs/screenshots/` — six screenshots of the core flows (login, owner
  dashboard, editor with toolbar, share dialog, recipient's dashboard,
  view-only editor).
- `walkthrough-video.txt` — the video link (see note below).

## Live product URL

**https://fullstack-seven-roan.vercel.app**

Deployed on Vercel; database on Supabase Postgres (free tier). No payment or
account creation is required to review it.

## Test accounts

Mocked auth — click a name on the login screen, no password:

| Name  | Email             |
|-------|-------------------|
| Alice | alice@docdocs.dev |
| Bob   | bob@docdocs.dev   |
| Carol | carol@docdocs.dev |

Alice owns a seeded document ("Welcome to DocDocs") already shared with Bob
(view access), so the sharing flow is visible immediately without needing to
set anything up.

## What's working

- Create, rename, and edit documents with rich-text formatting (bold,
  italic, underline, headings, bulleted/numbered lists), with autosave.
- Upload `.txt`, `.md`, or `.docx` → becomes a new editable document;
  other file types are rejected with a clear error.
- Share a document with another seeded user as view or edit; revoke access;
  dashboard visually distinguishes owned vs. shared documents with a
  permission badge.
- All of the above persists across refresh and across login sessions
  (verified directly against the production database, not just locally).
- Validation (Zod) and error handling (proper HTTP status codes, inline UI
  error messages) on every API route.
- One automated test suite (Vitest) covering the document-authorization
  logic that underlies the sharing feature.

## What's incomplete / explicitly out of scope

- **Real-time collaboration** (live multi-cursor co-editing) — not
  attempted; see `ARCHITECTURE.md` for why.
- **Comments/suggestion mode, version history, PDF/Markdown export,
  granular role-based permissions** — all listed as optional stretch items
  in the brief; none were built, to keep focus on the core four surfaces.
- **Concurrent-edit conflict handling** — two users with edit access saving
  the same document at the same time will last-write-wins overwrite each
  other; there's no version check or merge.

## What I'd build next with another 2-4 hours

1. A version counter + "this document changed, reload?" prompt to make
   concurrent edits safe (short of full real-time collaboration).
2. Basic version history (snapshot-on-save + restore).
3. Better `.docx` fidelity (table/style mapping in the mammoth conversion).
4. Markdown/PDF export.

Full reasoning for all of the above is in `ARCHITECTURE.md`.

## Walkthrough video

See `walkthrough-video.txt` for the link.
