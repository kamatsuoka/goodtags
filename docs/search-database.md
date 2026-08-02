# Offline search database

goodtags searches tags **offline**, against a local SQLite database rather than a
live API. This doc explains where that database comes from, how it lives and updates
on the device, and the non-obvious invariants that keep it working — several of which
exist to fix specific bugs that recurred over the years.

The implementation is in [`src/modules/sqlUtil.ts`](../src/modules/sqlUtil.ts)
(lifecycle + connection) and [`src/modules/searchutil.ts`](../src/modules/searchutil.ts)
(query building). Shared constants are in [`src/constants/sql.ts`](../src/constants/sql.ts).

## The big picture

The database is **read-only content**, not user data. It is regenerated daily on a
server, bundled into the app at build time, and refreshed over the network. There are
no app-side writes to it — every code path only reads.

```
server (daily) ──▶ GitHub Pages ──▶ device (download) ──┐
                                                         ▼
app bundle (build-time seed) ──▶ <documents>/SQLite/tags_db.sqlite ──▶ one connection ──▶ search
```

## Server side: how the DB is generated

- [`scripts/fetch_search_database.py`](../scripts/fetch_search_database.py) pulls the
  canonical tag data, builds a SQLite file, and writes a `manifest.json`.
- It runs daily via
  [`.github/workflows/generate_offline_search_database.yml`](../.github/workflows/generate_offline_search_database.yml)
  (cron `25 9 * * *`, ~02:25 PT) and deploys to the `gh-pages` branch, served at
  `https://kamatsuoka.github.io/goodtags` (`REMOTE_ASSET_BASE_URL`).
- **Schema versioning.** `LATEST_SCHEMA_VERSION` in the script must match
  `VALID_SCHEMA_VERSION` in `src/constants/sql.ts`. The manifest maps versions to file
  names, so a client only downloads a DB it understands:
  ```json
  {
    "generated_at_epoch_seconds": 1700000000,
    "db_name_by_version": { "1": "tags_db_v1.sqlite.otf" }
  }
  ```
- **Server-side safety floors.** The script refuses to deploy a DB with fewer than
  `MIN_EXPECTED_TAGS` (5000) tags, or fewer than `MIN_FRACTION_OF_PREVIOUS` (90%) of the
  previous deploy's count. This stops a bad upstream fetch from pushing a broken/empty
  DB to every client. (The client also validates independently — see below.)
- **The `.otf` extension is intentional.** GitHub Pages transparently gzips `.otf` but
  not `.sqlite`, so the DB is named `tags_db_v{N}.sqlite.otf` to get ~4x over-the-wire
  compression. It is a normal SQLite file once decompressed.

### Tables

`tags`, `tracks`, `videos`, a `schema(version)` marker, and an FTS virtual table
`tags_fts` (currently **fts4**) over `title`/`alt_title`/`arranger`/`lyrics`. Search uses
`tags.id IN (SELECT rowid FROM tags_fts WHERE tags_fts MATCH ?)` OR a `title LIKE`
fallback (see `buildSqlParts` in `searchutil.ts`).

## On-device lifecycle

On-disk layout (under `${documentDirectory}SQLite/`, i.e. app `filesDir` on Android /
`Documents` on iOS):

| File | Purpose |
| --- | --- |
| `tags_db.sqlite` | the current database (`TAGS_DB_NAME`) |
| `manifest.json` | the manifest for the current DB (`MANIFEST_NAME`) |
| `*.tmp` | transient staging files during a download; renamed into place or deleted |

**Seeding** (`initializeDbConnection`): the app ships a copy of the DB and manifest at
`src/assets/generated_db/`. On launch it copies them into local storage if either is
missing, the bundled copy is newer than what's on disk, or the on-disk DB has no `tags`
table (`currentDbHasTags`). Writes go to `*.tmp` first, then move into place, so a crash
mid-copy can't brick the DB.

## Connection model

**One shared connection.** `getDbConnection()` memoizes a single connection on a
module-level singleton; every caller shares it. Reads run **directly** against it — there
is no wrapping transaction (the DB is read-only, so sequential reads already see a
consistent snapshot).

Under normal operation the connection isn't swapped while the app runs. It can be
**replaced wholesale** in two cases — but never mutated in place or closed mid-query:

- a **manual force refresh** (`refreshDbNow`) reopens onto a freshly downloaded DB;
- a **failed initialization** clears the singleton so the next `getDbConnection()` retries
  from scratch (recovering a broken first-launch seed without needing an app restart).

> This is deliberately simpler than earlier versions, which hot-swapped the connection
> mid-session behind a hand-rolled reader/writer lock. That machinery was the source of
> a long tail of subtle concurrency bugs; removing it made a whole class of them
> structurally impossible. If you're tempted to reintroduce mid-session swapping, read
> the "Tradeoffs" section first.

## Updates

### Automatic: stage now, adopt on next launch

After opening, the app kicks off `backgroundCheckForRemoteUpdates` once. It fetches the
remote manifest and, if it's newer, downloads + validates the new DB and **moves it into
place on disk without touching the live connection**. The running session keeps reading
its already-open file; the new DB is adopted the **next time the app launches** and
`initializeDbConnection` opens it.

Adoption timing is therefore a **cold start** (force-quit → reopen, or the OS reclaiming
the app from the background) — not a warm resume. For a daily-updated DB this is
invisible in practice.

### Manual: force refresh (Data page)

The **Data** screen (`Home → data`) has a **refresh** row that calls `refreshDbNow(true)`.
A forced refresh re-downloads, re-validates, and **re-adopts in-session** by reopening the
connection immediately — the way to recover a stale or corrupted local DB. It always
re-downloads (it skips the "is the remote newer?" check), so it's a deliberate ~3.6 MB
action. See [`src/screens/DataScreen.tsx`](../src/screens/DataScreen.tsx); it's exercised
in the screenshot flow via [`e2e/maestro/_backup.yaml`](../e2e/maestro/_backup.yaml).

Both the startup check and the manual refresh go through a single serialized chain
(`checkForRemoteUpdate`), so two update runs can never write the same `*.tmp` file at once
and a forced refresh can't be silently satisfied by an in-flight non-forced check.

## Invariants and gotchas (the *why*)

Each of these fixed a real, recurring bug. Preserve them.

- **`useNewConnection: true`** (`DB_OPEN_OPTIONS`). expo-sqlite caches connections by
  database *name*. Because we delete and move the DB file on disk and reopen the same
  name, a cached connection can point at a pre-move file and report `no such table: tags`
  against a perfectly valid DB. A fresh connection every open reflects what's on disk now.
- **`finalizeUnusedStatementsBeforeClosing: false`** (`DB_OPEN_OPTIONS`). FTS finalizes
  its own statements on close; expo-sqlite's "finalize anything left open" pass then
  double-frees them and crashes with `SIGABRT` in `exsqlite3_finalize`
  ([expo/expo#38168](https://github.com/expo/expo/issues/38168)). Disabling that pass
  avoids the double free.
- **Open by basename, never full path.** `openDatabaseAsync` resolves its argument under
  `defaultDatabaseDirectory`; passing a full URI silently opens a brand-new empty DB.
  Even the tmp DB is validated by basename (`${TAGS_DB_NAME}.tmp`).
- **Never set `Accept-Encoding` manually** on the download. iOS/Android only transparently
  decompress gzip when the *platform* added the header. Setting it ourselves disables that,
  so we'd write raw gzipped bytes and SQLite would fail with `no such table`.
- **Validate before adopting.** A download is opened and checked for a non-empty `tags`
  table (`SELECT COUNT(*)`); a missing/unreadable/zero-row DB is discarded, never staged.
  This is belt-and-suspenders with the server-side floors.
- **`await` every `File.move()`.** `File.move()` is async; not awaiting it lets a following
  `openDatabaseAsync` race the in-flight move and open a not-yet-written file (→ empty DB,
  `no such table: tags`).

## Tradeoffs and known behaviors

- **Freshness lag.** Automatic updates are adopted on the next cold start, not
  mid-session. Users who keep the app warm indefinitely stay on the old DB until a
  restart; the manual **force refresh** is the escape hatch.
- **Transient extra copy on disk.** When an update is staged, the current file is deleted
  and replaced while a connection still has it open. On POSIX (iOS/Android) the old inode
  (~3.6 MB) stays alive until that connection closes — so during such a session there are
  briefly *two* copies: the new file plus the old, now-unlinked inode. It's reclaimed when
  the process exits (next launch).
- **Force-refresh connection leak.** `refreshDbNow` reopens by reassigning the singleton
  and **drops the old connection without closing it** (closing mid-query is the FTS
  `SIGABRT` above). Its inode is reclaimed only when GC finalizes it, so repeatedly tapping
  refresh can transiently stack a few old copies until GC/restart. Bounded and rare, but
  real. Closing the old connection deliberately (now safer given the finalize workaround)
  would remove this — at the cost of guarding against an in-flight query.

## Backup note

The search DB is **regenerable content**, so it should not need to be backed up or
transferred between devices — it's re-seeded from the bundle and re-downloaded. It
currently falls under the Android backup `domain="file"` rules (see
[`data-migration-solution.md`](data-migration-solution.md)); excluding `SQLite/` there
would keep it out of cloud backups. (User data — favorites/labels — is a separate concern
covered by that doc.)

## Migrating fts4 → fts5

`tags_fts` is currently an **fts4** external-content table. FTS5 is a possible future
upgrade. This is a scoping note, not a plan of record.

**The main blocker is already cleared:** expo-sqlite compiles FTS5 in on both platforms
(`-DSQLITE_ENABLE_FTS5=1` in its Android `build.gradle` and iOS podspec). The client SQL
is already portable — `SELECT rowid FROM tags_fts WHERE tags_fts MATCH ?` with a `term*`
prefix works identically on fts4 and fts5 and uses no fts4-only functions — and the
`finalizeUnusedStatementsBeforeClosing: false` close-crash workaround is already in place.

What upgrading would involve, roughly in order:

1. **Generator** (`scripts/fetch_search_database.py`) — swap the one CREATE to
   `CREATE VIRTUAL TABLE tags_fts USING fts5(title, alt_title, arranger, lyrics, content=tags, content_rowid=id);`.
   The existing `INSERT INTO tags_fts(rowid, …)` population works as-is for fts5 external
   content (or use `INSERT INTO tags_fts(tags_fts) VALUES('rebuild')`). No on-device
   triggers needed — the DB is built once and read-only.
2. **Schema version bump** — `LATEST_SCHEMA_VERSION` (py) and `VALID_SCHEMA_VERSION` (ts)
   `1 → 2`. Even though fts5 *might* be query-compatible with old clients, you can't assume
   every shipped app build had fts5 enabled in its (older) expo-sqlite; the version bump is
   the mechanism that means you never have to reason about that.
3. **Rollout strategy — the real decision.** The manifest maps `version → filename` and the
   generator currently emits one version:
   - **Dual-publish (graceful):** generate both `v1` (fts4) and `v2` (fts5) each run, list
     both in the manifest. New app builds use `v2`; old installs keep getting `v1` updates.
     More generator work, no stranded users.
   - **Hard cutover (simple):** emit `v2` only. Old clients look up `db_name_by_version[1]`,
     find nothing, and `backgroundCheckForRemoteUpdates` returns `UpToDate` — they **freeze
     on their last v1 DB** (still works, just stops getting fresh tags) until the app is
     updated.
4. **Re-bundle the seed asset** as v2 (fts5) so fresh installs seed fts5. The on-device
   filename is version-agnostic (`tags_db.sqlite`), so nothing renames locally.
5. **Client query** — probably no change required, but two behavioral points to *validate*:
   - **Tokenizer change is both the payoff and the main risk.** fts4 defaults to ASCII
     `simple`; fts5 defaults to `unicode61`, which folds diacritics and case — so accented
     titles/arrangers become searchable and matching is case-insensitive, but results
     *change*, so spot-check. The existing `OR tags.title LIKE ?` fallback cushions
     surprises.
   - fts5 treats uppercase bareword `AND`/`OR`/`NOT`/`NEAR` as operators; the query is
     already sanitized to `[a-zA-Z0-9 ]`, so the only residual edge is those words typed in
     caps (optional: lowercase-fold before MATCH).
6. **Testing** is mostly integration, not unit: the `sqlUtil` tests mock the DB and the
   `searchutil` tests assert the (unchanged) SQL string, so they won't catch behavior
   changes. Build a v2 DB and compare search results against v1 for single-word, prefix,
   multi-word, and especially **accented** queries, plus the Maestro `db-swap-search` flow.

**ROI:** the concrete win is the `unicode61` tokenizer (accent/case folding), which is
genuinely useful for a DB full of names. fts5's other headline features (bm25 ranking,
`snippet`/`highlight`, prefix indexes) mostly don't apply here — results are sorted by
explicit columns, not relevance, and at ~7k tags fts4 performs fine. So absent a specific
complaint about accented or case-sensitive search, this is modernization/future-proofing
rather than urgent: low-risk, but the payoff is gated behind the rollout coordination in
step 3.

## Key files

| File | Role |
| --- | --- |
| `src/modules/sqlUtil.ts` | connection lifecycle, seeding, remote update, force refresh |
| `src/modules/searchutil.ts` | query building and search execution |
| `src/constants/sql.ts` | names, URLs, schema version, manifest type |
| `src/screens/DataScreen.tsx` | the manual "refresh" control |
| `scripts/fetch_search_database.py` | server-side DB generation + manifest |
| `.github/workflows/generate_offline_search_database.yml` | daily generation schedule |
| `src/modules/__tests__/sqlUtil.test.ts` | regression tests for the invariants above |
