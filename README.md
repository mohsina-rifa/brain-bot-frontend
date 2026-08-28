# BrainBot Console

A responsive operator console and chat playground for the provided NestJS
chatbot backend. An operator can sign in, create bots, manage the Q&A knowledge
base each bot answers from, tune the bot's branding, and test the result in a
playground — with every screen honest about what is loading, empty, slow or
broken.

Built with Vue 3 + TypeScript + Vite + Bootstrap 5.

---

## 1. Prerequisites

- **Docker Desktop** (the backend's Postgres and MongoDB run in containers)
- **Node.js 24.x** — `nvm install` in each folder picks up the pinned version
- **Yarn** for the backend (via Corepack), **npm** for this frontend
- A **Google Gemini API key** — free at <https://aistudio.google.com/apikey>.
  Without it the backend boots, but chat answers and Q&A saves fail, because
  every Q&A entry is embedded on write.

## 2. Run it — backend first, then frontend

The frontend is useless on its own; start the backend and confirm it answers
before you touch this folder.

### 2.1 Backend

```bash
cd brain-bot-backend-main
nvm install
corepack enable
yarn setup          # copies .env, starts Docker, seeds roles + admin user
```

Now open `brain-bot-backend-main/.env` and set your key:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

Then:

```bash
yarn start:dev
```

Confirm it is up — this should return `401`, not a connection error:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4040/api/bots
```

The seeded admin is **`admin@bs23.com` / `admin23`**.

### 2.2 Frontend

```bash
cd brain-bot-frontend-main
npm install
npm run dev
```

Open <http://localhost:5173> and sign in with the seeded admin above.

### 2.3 Frontend environment

`.env` is optional. Copy the template only if you need to change something:

```bash
cp .env.example .env
```

| Variable        | Default        | Meaning                                                   |
| --------------- | -------------- | --------------------------------------------------------- |
| `VITE_API_URL`  | *(unset)*      | Unset uses the Vite dev proxy: `/api` → `localhost:4040`.  |
|                 |                | Set an absolute URL when the backend is somewhere else.    |

No secret is needed by, or committed in, this repo. The Gemini key lives only in
the backend's `.env`, which is git-ignored.

---

## 3. Changes I had to make to the provided backend

**Read this before running the backend.** Five defects stopped the required
features from working at all. The backend folder is **not a git repository**, so
these fixes exist only in the working tree — they appear in no commit history,
and a reviewer who re-runs `yarn setup` against a fresh copy will hit them.

| # | Defect | Fix |
| - | ------ | --- |
| 1 | Google retired `text-embedding-004` and `gemini-2.0-flash`; every `POST /api/qna` failed with `Failed to generate embeddings`, masking a 404 from Google. | Moved to `gemini-embedding-001` + `gemini-2.5-flash` via REST, requesting `outputDimensionality: 768` with L2 normalisation to match the `vector(768) NOT NULL` column. TASK.md explicitly permits this: *"if you aim to use a newer model, configure accordingly."* |
| 2 | Bot delete opened a MongoDB transaction, which standalone (non-replica-set) MongoDB rejects — deleting a bot always failed. | Removed the transaction. |
| 3 | `countVectors` passed a Mongoose `ObjectId` to Postgres, so the count came back `0` while rows existed — pagination rendered "0 entries" over a full table. | `.toString()` before the query. |
| 4 | Q&A paging had no `ORDER BY`, so Postgres was free to repeat or skip rows across pages. | Deterministic `createdAt DESC, id` ordering. Verified: at limit 5, pages 1/2/3 return 5+5+3 unique ids with no overlap. |
| 5 | The `q` search parameter never reached the repository — a Mongo-shaped query builder turned it into a `RegExp`, which Postgres ignored. Search silently returned everything. | A shared `buildWhere()` used by **both** `findAllVectors` and `countVectors` (filtering rows but not the count is exactly defect 3 again), emitting `ILIKE ... ESCAPE '\'` with `%`, `_` and `\` escaped so typed wildcards stay literal. |

Diagnosis was done with `curl` against the running API rather than by reading
the code alone; three of the five were caught before the feature they broke was
built.

---

## 4. Requirements map

Every line of TASK.md, and where it lives.

| TASK.md requirement | Where | Notes |
| ------------------- | ----- | ----- |
| Authenticate via credentials | `/login` | JWT from `POST /auth/admin-login`; router guard on every other route |
| Create a bot and start a conversation | `/bots` → Create bot; `/bots/:id/playground` | Multipart create; conversation opens on first message |
| View and manage Q&A content | `/bots/:id/qna` | Server-paginated, adjustable page size, expandable rows |
| Add / Edit supported Q&A content | Q&A → Add entry / Edit | One dialog, two modes; duplicate-question warning before save |
| Remove Q&A content | Q&A → Delete | Confirmation dialog naming the entry; retry in place on failure |
| Identify and recover from failed operations | Everywhere | See the state table in §6 |
| Search or filter managed content | Q&A search bar | Debounced, **server-side**, reflected in the URL, matches highlighted |
| Chatbot playground testing the Q&A knowledge base | `/bots/:id/playground` | Shows which Q&A entries matched, with cosine scores |
| Begin and reset test conversations | Playground → Reset | Confirmation when a thread would be discarded |
| Understand loading, empty, success, failure states | Everywhere | Four-state chain on every list; toasts on success |
| Manage chatbot branding settings from UI | `/bots/:id/settings` | Name, description, colour picker, status, welcome / fallback / suggestion messages, hand-over toggle and message |
| Responsive | All routes | Verified at 375px, 768px, 1440px; sidebar becomes an offcanvas drawer |
| Clear when operations are async or slow | Everywhere | Skeletons, refetch spinners, and a "still working" message after 5s |

Unprompted extras that fell out of the API: a failed chat answer is recorded as
an **unresolved query** the operator could later turn into Q&A content, and the
playground reveals the **matched entries and their similarity scores**, so the
playground tests the knowledge base rather than just demoing it.

---

## 5. Key decisions

**Why Vue and not React/Next.** The assignment names no framework. Vue 3 with
`<script setup>` is what I am fastest and most precise in, and at a 15-hour
budget the framework I make fewest mistakes in is worth more than the one with
the larger ecosystem.

**Why Bootstrap and not Tailwind.** The console is conventional CRUD:
tables, modals, forms, toasts. Bootstrap ships all of those already accessible
and already responsive, so the budget went into states and error handling
instead of rebuilding a dropdown. `bootstrap-vue-next` provides the Vue
bindings — note it does **not** register components globally, so every component
is imported explicitly where used.

**Why a hand-rolled `useApi` instead of TanStack Query.** TanStack Query is the
right answer on a real product with cache invalidation across many screens. Here
it would have been a dependency whose defaults I would then have to justify
anyway. `useApi` is ~100 lines exposing exactly the five things TASK.md asks
about — `data`, `loading`, `error`, `slow`, `retrying` — plus `run`/`retry`,
with `AbortController` cancellation on scope disposal so an unmounted component
cannot write to a dead ref. Being small, its retry policy is explicit rather
than inherited (see §6).

**How auth is stored.** The JWT goes in `localStorage`, attached by an axios
request interceptor. A response interceptor turns any `401` into a single
session-wide logout and a redirect to `/login?reason=expired&next=…`, so the
user is told why they were bounced and lands back where they were. `localStorage`
is chosen for a same-origin admin tool with a short-lived token; a production
build should prefer an httpOnly refresh cookie, which requires backend changes
outside this scope. Note the JWT carries no email or name — only `_id` and
`roleId` — which is why the header shows no user identity.

**Validation is native HTML5**, not VeeValidate or Zod. The forms are three to
nine fields; the backend already validates and returns per-field messages, which
are mapped straight onto the inputs.

---

## 6. State and failure handling

The three TASK.md lines about states, recovery and slowness were treated as
their own piece of work rather than as polish.

**Every list follows the same four-state chain:** loading → error → empty →
content. Empty means a real empty state with an explanation and an action, never
a blank panel. On the Q&A list, "no entries yet" and "nothing matched your
search" are deliberately different screens with different actions.

**First load vs refetch.** First load shows a skeleton of the table that is
coming. A refetch — paging, changing page size, refreshing after a delete —
keeps the existing table on screen, dimmed with `aria-busy`, and moves only a
small spinner next to the heading. The table never blanks out.

**Slow operations.** After roughly five seconds, any in-flight request says so.
Q&A create and chat send get specific wording, because both wait on an embedding
round-trip and are the two genuinely slow operations in the app.

**Errors say what failed and what to do next.** A central mapper turns every
error shape into a sentence. **No raw status code reaches the UI**, and NestJS's
habit of returning the status name as the message (`"Unauthorized"`) is
filtered out in favour of wording that tells the user what to do.

**No dead ends.** Every failure offers an action: retry, dismiss, or a route out.
A failed mutation keeps the values the user typed — nothing is retyped after a
failure.

**Retry policy, chosen rather than defaulted:**

- **Reads** (`/bots`, `/qna` lists) retry up to 3 times with 300 / 600 / 1200 ms
  backoff.
- **Writes never retry automatically.** A `POST` that appears to fail may have
  already applied on the server; retrying it risks a duplicate Q&A entry. Every
  mutation retries only when the user clicks.
- Only network errors, timeouts, `429` and `5xx` are retryable. A `4xx` means the
  request itself was wrong, so repeating it just wastes the user's time; an
  aborted request was our own doing.

**Offline** is detected separately from request failure: a banner appears while
the browser reports no connection, and confirms when it returns.

---

## 7. What I cut, and why

The budget was 15 hours across three days of office hours. These were dropped
deliberately, not forgotten:

- **Automated tests (Vitest + MSW).** The largest and most defensible cut. With
  one afternoon left, a broken recovery path a reviewer *can* see costs more
  than the tests they cannot. I would start with `useApi` and `toMessage`, which
  are pure and carry the most logic.
- **Icon and logo upload** on the branding form. The backend accepts both as
  multipart files; the remaining nine branding fields are all editable.
- **Semantic-search toggle and date filtering** on the Q&A list. Text search
  covers the stated requirement.
- **Column sorting, batch import, optimistic updates** on the Q&A table.
- **Live branding preview** beside the settings form, and a dirty-state
  indicator on it. The playground already reflects saved branding.
- **A custom Sass theme.** The app uses stock Bootstrap with a colour accent
  driven by each bot's own configured colour.

## 8. Known limitations

- **`PUT /api/qna/:id` never bumps `updatedAt`** on the backend. The "Updated"
  column therefore still shows the creation time after an edit. Left unfixed
  deliberately: unlike the five defects in §3, it breaks no required feature,
  and I preferred to stop changing a backend I was given.
- **`GET /api/conversations?botId=` returns `total: 0`** with rows present — the
  same class of bug as §3 defect 3. Not needed by any screen here, so not fixed.
- **No conversation history browser.** The playground starts a fresh
  conversation; previous ones are kept server-side but not listed.
- **The header shows no signed-in user**, because the JWT carries no
  identifying claim (see §5).
- **No automated tests** (§7).
- Demo data may include an `Empty Bot` with no Q&A entries. It exists so the
  empty state is demonstrable without deleting real content.

## 9. With more time

1. Tests around `useApi`, `toMessage` and the Q&A mutation paths, with MSW.
2. Move the token to an httpOnly refresh cookie and add silent renewal.
3. An unresolved-queries screen: the app already records every question the bot
   could not answer, which is the natural backlog for growing the knowledge base
   — one screen away from being the most useful feature in the product.
4. Optimistic updates on Q&A edit and delete, now that the rollback path
   (`recordFailure` + retry) already exists.
5. Fix and upstream the two backend defects in §8.

---

## 10. Project layout

```
src/
  api/client.ts          axios instance, auth + 401 interceptors, error mapper
  composables/
    useApi.ts            loading / error / slow / retry primitive
    useBots.ts           bot list + delete
    useQna.ts            Q&A list, search, create, edit, delete
    useConversation.ts   playground thread, matched entries, unresolved queries
    useOnline.ts         connectivity
    useSlowFlag.ts       the 5-second clock for non-useApi requests
    useDebounce.ts       search debouncing
  stores/
    auth.ts              token, decoded claims, login / logout
    activeBot.ts         the bot the sidebar, playground and settings share
  components/            AppShell, SideNav, dialogs, table, chat, skeleton
  views/                 Login, Bots, Qna, Playground, BotSettings
```

## 11. Commands

| Command           | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Dev server on <http://localhost:5173>                  |
| `npm run build`   | Type-check (`vue-tsc -b`) and build to `dist/`         |
| `npm run preview` | Serve the production build locally                     |

There is no lint script; `noUnusedLocals` and `noUnusedParameters` are enabled
in `tsconfig`, so a clean `npm run build` also proves there is no unused import
or variable in the project.
