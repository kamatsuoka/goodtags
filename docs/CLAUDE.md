# docs/

Design, architecture, and background docs for goodtags. Keep each in sync with the code
it describes — when you change that area, update the doc in the same PR.

- [search-database.md](search-database.md) — architecture of the offline tag-search
  SQLite database: how it's generated server-side, seeded from the bundle, updated over
  the network, adopted, and queried on-device, plus the hard-won invariants in
  `src/modules/sqlUtil.ts` (each one fixes a specific recurring bug). **Read/update this
  before changing the DB download, seed, connection, or update logic** (`sqlUtil.ts`,
  `searchutil.ts`, `src/constants/sql.ts`, `scripts/fetch_search_database.py`).
- [data-migration-solution.md](data-migration-solution.md) — how **user data**
  (favorites/labels in AsyncStorage) is backed up and transferred between devices
  (Android backup rules, iOS Info.plist). Distinct from the search DB, which is
  regenerable content.
- [background.md](background.md) — narrative history of the project. Not technical.
- [FAQ.md](FAQ.md) — user-facing FAQ.
- [v2.md](v2.md) — summary of features introduced in v2.
