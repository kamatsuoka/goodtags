import { MANIFEST_NAME, TAGS_DB_NAME, VALID_SCHEMA_VERSION } from '@app/constants/sql'
import getUrl from '@app/modules/getUrl'
import {
  __resetDbStateForTest,
  backgroundCheckForRemoteUpdates,
  DbUpdateResult,
  getDbConnection,
  refreshDbNow,
} from '@app/modules/sqlUtil'
import { setImmediate } from '@testing-library/react-native/build/helpers/timers'
import { File } from 'expo-file-system'
import * as SQLite from 'expo-sqlite'

jest.mock('@app/modules/getUrl')

// initializeDbConnection reaches for the DB and manifest bundled into the app, which
// these two helpers pull in with require(). Jest resolves those to the real files and
// tries to parse them as JS -- the .sqlite one fails on its own header ("SQLite format
// 3..." -> Unexpected identifier 'format'). Stub just the two getters; every real
// constant stays actual.
jest.mock('@app/constants/sql', () => {
  const actual = jest.requireActual('@app/constants/sql')
  return {
    ...actual,
    getReactNativeAppSqlModule: () => 1,
    getReactNativeAppManifestModule: () => ({
      generated_at_epoch_seconds: 1000,
      db_name_by_version: { [actual.VALID_SCHEMA_VERSION]: 'tags_db_v1.sqlite.otf' },
    }),
  }
})

const mockGetUrl = getUrl as jest.MockedFunction<typeof getUrl>
const mockOpenDatabaseAsync = SQLite.openDatabaseAsync as jest.Mock
const mockFile = File as unknown as jest.Mock

/** Wait a little bit for promises to reach a steady state */
async function settle() {
  await new Promise(setImmediate)
}

describe('backgroundCheckForRemoteUpdates', () => {
  const sqlDir = '/data/SQLite/'
  const currentSqlPath = `${sqlDir}${TAGS_DB_NAME}`
  const currentManifestPath = `${sqlDir}manifest.json`
  const tmpSqlPath = `${currentSqlPath}.tmp`
  const tmpManifestPath = `${currentManifestPath}.tmp`

  // Recorded by the File mock so tests can assert what happened on disk.
  let movedFrom: string[]
  let deleted: string[]
  let defaultFileImpl: any

  const runCheck = () =>
    backgroundCheckForRemoteUpdates(
      currentSqlPath,
      currentManifestPath,
      tmpSqlPath,
      tmpManifestPath,
    )

  beforeEach(() => {
    mockGetUrl.mockReset()
    mockOpenDatabaseAsync.mockReset()
    movedFrom = []
    deleted = []
    defaultFileImpl = mockFile.getMockImplementation()

    // Recording File mock: every File records its own move()/delete() by source uri.
    mockFile.mockImplementation((uri: string) => ({
      exists: true,
      uri,
      text: jest.fn(async () => '{}'),
      write: jest.fn(),
      copy: jest.fn(),
      delete: jest.fn(() => {
        deleted.push(uri)
      }),
      move: jest.fn(async () => {
        movedFrom.push(uri)
      }),
    }))

    // Remote manifest is newer than local (local mock File.text() returns '{}',
    // so currentGeneratedAt is undefined and any remote value counts as newer),
    // and advertises a DB for the current schema version.
    mockGetUrl.mockImplementation(async (url: string) => {
      if (url.endsWith('manifest.json')) {
        return {
          generated_at_epoch_seconds: 2000,
          db_name_by_version: { 1: 'tags_db_v1.sqlite.otf' },
        } as any
      }
      // The SQL download
      return new ArrayBuffer(100) as any
    })

    // Validation query reports a healthy table so the download is staged.
    mockOpenDatabaseAsync.mockResolvedValue({
      getAllAsync: async () => [{ count: 6975 }],
      closeAsync: async () => {},
    })
  })

  afterEach(() => {
    mockFile.mockImplementation(defaultFileImpl)
  })

  it('stages the validated download into place for the next launch', async () => {
    const result = await runCheck()
    await settle()

    expect(result).toBe(DbUpdateResult.Updated)
    // The validated tmp files are moved onto the current paths...
    expect(movedFrom).toEqual([tmpSqlPath, tmpManifestPath])
    // ...after the current files are deleted first (move does not overwrite).
    expect(deleted).toEqual([currentSqlPath, currentManifestPath])
  })

  it('writes the downloaded DB as raw bytes, not a base64 string', async () => {
    // Regression: the DB used to be base64-encoded before being written. Writing the
    // ArrayBuffer's bytes straight through avoids the ~33% encode overhead and an
    // encoding-flag mismatch that would leave base64 text on disk instead of a DB.
    const sqlWrites: unknown[] = []
    mockFile.mockImplementation((uri: string) => ({
      exists: true,
      uri,
      text: jest.fn(async () => '{}'),
      write: jest.fn((data: unknown) => {
        if (uri === tmpSqlPath) sqlWrites.push(data)
      }),
      copy: jest.fn(),
      delete: jest.fn(),
      move: jest.fn(async () => {}),
    }))

    await runCheck()
    await settle()

    expect(sqlWrites).toHaveLength(1)
    expect(sqlWrites[0]).toBeInstanceOf(Uint8Array)
  })

  it('reports up-to-date and stages nothing when the remote is not newer', async () => {
    // Local manifest reads back a generated_at at/above the remote's, so there's
    // nothing to download.
    mockFile.mockImplementation((uri: string) => ({
      exists: true,
      uri,
      text: jest.fn(async () => JSON.stringify({ generated_at_epoch_seconds: 9999 })),
      write: jest.fn(),
      copy: jest.fn(),
      delete: jest.fn(() => {
        deleted.push(uri)
      }),
      move: jest.fn(async () => {
        movedFrom.push(uri)
      }),
    }))

    const result = await runCheck()
    await settle()

    expect(result).toBe(DbUpdateResult.UpToDate)
    expect(movedFrom).toEqual([])
    // No download attempted at all -- only the manifest was fetched.
    expect(mockGetUrl.mock.calls.every(call => String(call[0]).endsWith('manifest.json'))).toBe(
      true,
    )
  })

  it('force: downloads and stages even when the remote is not newer', async () => {
    // Same not-newer setup as above, but forced -- so it must download and stage the
    // remote DB anyway (the recovery path).
    mockFile.mockImplementation((uri: string) => ({
      exists: true,
      uri,
      text: jest.fn(async () => JSON.stringify({ generated_at_epoch_seconds: 9999 })),
      write: jest.fn(),
      copy: jest.fn(),
      delete: jest.fn(() => {
        deleted.push(uri)
      }),
      move: jest.fn(async () => {
        movedFrom.push(uri)
      }),
    }))

    const result = await backgroundCheckForRemoteUpdates(
      currentSqlPath,
      currentManifestPath,
      tmpSqlPath,
      tmpManifestPath,
      true, // force
    )
    await settle()

    expect(result).toBe(DbUpdateResult.Updated)
    expect(movedFrom).toEqual([tmpSqlPath, tmpManifestPath])
  })

  it('never hot-swaps live connection (opens no DB other than the tmp validation)', async () => {
    // The whole point of the "adopt on next launch" design: this background path
    // must not reopen TAGS_DB_NAME into the running app. It opens only the tmp DB to
    // validate the download; the live connection is left untouched.
    await runCheck()
    await settle()

    const openArgs = mockOpenDatabaseAsync.mock.calls.map(call => call[0])
    expect(openArgs).toEqual([`${TAGS_DB_NAME}.tmp`])
    expect(openArgs).not.toContain(TAGS_DB_NAME)
  })

  it('opens the downloaded tmp DB by basename, never by full path', async () => {
    // Regression: expo-sqlite's openDatabaseAsync treats its argument as a name
    // relative to defaultDatabaseDirectory, so passing the full tmpSqlPath URI
    // silently opens a brand-new empty DB -> "no such table: tags". Every DB open
    // in this module must use a bare basename.
    await runCheck()
    await settle()

    const openArgs = mockOpenDatabaseAsync.mock.calls.map(call => call[0])
    expect(openArgs).toContain(`${TAGS_DB_NAME}.tmp`)
    for (const arg of openArgs) {
      expect(arg).not.toContain('/')
    }
  })

  it('opens tmp DB with fresh connection (useNewConnection) to bypass the cache', async () => {
    // Regression: expo-sqlite's connection cache is keyed by database name and hands
    // back a cached connection for a name even after we've deleted/moved the file on
    // disk, yielding "no such table: tags" against a valid DB. Every open in this
    // module must force a fresh connection so it reflects the current on-disk file.
    await runCheck()
    await settle()

    expect(mockOpenDatabaseAsync.mock.calls.length).toBeGreaterThan(0)
    for (const call of mockOpenDatabaseAsync.mock.calls) {
      expect(call[1]?.useNewConnection).toBe(true)
    }
  })

  it('awaits File.move so staging completes before the function resolves', async () => {
    // Regression: File.move() is async. If it isn't awaited, the function resolves
    // while the move is still in flight, so the staged DB may not actually be on disk
    // (and could be interrupted by app backgrounding). Awaiting guarantees both moves
    // finish before we report done.
    let resolveMove: () => void = () => {}
    const moveGate = new Promise<void>(resolve => {
      resolveMove = resolve
    })
    let sqlMoveDone = false
    mockFile.mockImplementation((uri: string) => ({
      exists: true,
      uri,
      text: jest.fn(async () => '{}'),
      write: jest.fn(),
      copy: jest.fn(),
      delete: jest.fn(),
      move: jest.fn(async () => {
        if (uri === tmpSqlPath) {
          await moveGate
          sqlMoveDone = true
        }
      }),
    }))

    let resolved = false
    const done = runCheck().then(() => {
      resolved = true
    })
    await settle()

    // The move is gated open, so the function must not have resolved yet.
    expect(resolved).toBe(false)
    expect(sqlMoveDone).toBe(false)

    resolveMove()
    await done
    expect(sqlMoveDone).toBe(true)
  })

  it('rejects (rather than swallowing) when the download fails', async () => {
    // The caller in initializeDbConnection attaches a .catch() to log background
    // failures. That only works if this function actually propagates the rejection
    // instead of swallowing it; a silent swallow here would hide network errors and
    // make the .catch() dead code. getUrl rejects on network failure/non-200.
    mockGetUrl.mockImplementation(async (url: string) => {
      if (url.endsWith('manifest.json')) {
        return {
          generated_at_epoch_seconds: 2000,
          db_name_by_version: { 1: 'tags_db_v1.sqlite.otf' },
        } as any
      }
      throw new Error('network down')
    })

    await expect(runCheck()).rejects.toThrow('network down')
  })

  it('does not set an Accept-Encoding header on the DB download', async () => {
    // Regression: manually setting Accept-Encoding: gzip disables the platform's
    // transparent gzip decompression, so we'd write compressed bytes to disk.
    await runCheck()
    await settle()

    const sqlDownloadCall = mockGetUrl.mock.calls.find(call => String(call[0]).endsWith('.otf'))
    expect(sqlDownloadCall).toBeDefined()
    const config = sqlDownloadCall![1]
    expect(config?.responseType).toBe('arraybuffer')
    expect(config?.headers).toBeUndefined()
  })

  it('discards a downloaded DB whose tags table is missing or unreadable', async () => {
    // The validation that protected us during the gzip incident: a download that
    // isn't a usable tags DB must be thrown away rather than staged.
    mockOpenDatabaseAsync.mockResolvedValue({
      getAllAsync: async () => {
        throw new Error('no such table: tags')
      },
      closeAsync: async () => {},
    })

    const result = await runCheck()
    await settle()

    expect(result).toBe(DbUpdateResult.Unavailable)
    // Validation failed, so nothing is staged: the bad tmp download is deleted and no
    // file is moved onto the current paths.
    expect(movedFrom).toEqual([])
    expect(deleted).toContain(tmpSqlPath)
  })

  it('downloads and stages when the local manifest is missing or unreadable', async () => {
    // Regression: reading the local manifest strictly threw before the check ever hit
    // the network, so a half-seeded install -- no manifest, or a truncated one -- could
    // never fetch the DB that would fix it. An unreadable manifest means we have
    // nothing, so the remote is newer by definition and must be downloaded.
    mockFile.mockImplementation((uri: string) => ({
      exists: true,
      uri,
      text: jest.fn(async () => {
        throw new Error('ENOENT')
      }),
      write: jest.fn(),
      copy: jest.fn(),
      delete: jest.fn(() => {
        deleted.push(uri)
      }),
      move: jest.fn(async () => {
        movedFrom.push(uri)
      }),
    }))

    const result = await runCheck()
    await settle()

    expect(result).toBe(DbUpdateResult.Updated)
    expect(movedFrom).toEqual([tmpSqlPath, tmpManifestPath])
  })

  it('discards a downloaded DB whose tags table is empty (count 0)', async () => {
    // A structurally valid but zero-row DB must not replace the working DB. This is
    // belt-and-suspenders with the server-side floor in
    // scripts/fetch_search_database.py (MIN_EXPECTED_TAGS / MIN_FRACTION_OF_PREVIOUS).
    mockOpenDatabaseAsync.mockResolvedValue({
      getAllAsync: async () => [{ count: 0 }],
      closeAsync: async () => {},
    })

    const result = await runCheck()
    await settle()

    expect(result).toBe(DbUpdateResult.Unavailable)
    expect(movedFrom).toEqual([])
    expect(deleted).toContain(tmpSqlPath)
  })
})

describe('refreshDbNow', () => {
  let defaultFileImpl: any

  beforeEach(() => {
    mockGetUrl.mockReset()
    mockOpenDatabaseAsync.mockReset()
    __resetDbStateForTest()
    defaultFileImpl = mockFile.getMockImplementation()

    // Healthy validation stub for any opened DB.
    mockOpenDatabaseAsync.mockResolvedValue({
      getAllAsync: async () => [{ count: 6975 }],
      closeAsync: async () => {},
    })
  })

  afterEach(() => {
    mockFile.mockImplementation(defaultFileImpl)
    __resetDbStateForTest()
  })

  // Newer remote available -> validated download gets staged.
  const mockNewerRemote = () => {
    mockGetUrl.mockImplementation(async (url: string) => {
      if (url.endsWith('manifest.json')) {
        return {
          generated_at_epoch_seconds: 2000,
          db_name_by_version: { 1: 'tags_db_v1.sqlite.otf' },
        } as any
      }
      return new ArrayBuffer(100) as any
    })
  }

  it('returns Updated and reopens the connection when a newer DB is staged', async () => {
    mockNewerRemote()

    const result = await refreshDbNow()

    expect(result).toBe(DbUpdateResult.Updated)
    // Adoption = a fresh open of the live DB name (in addition to the tmp validation open).
    const openArgs = mockOpenDatabaseAsync.mock.calls.map(call => call[0])
    expect(openArgs).toContain(TAGS_DB_NAME)
  })

  it('returns UpToDate and does NOT reopen when the remote is not newer', async () => {
    // Local manifest is at/above the remote generated_at.
    mockFile.mockImplementation((uri: string) => ({
      exists: true,
      uri,
      text: jest.fn(async () => JSON.stringify({ generated_at_epoch_seconds: 9999 })),
      write: jest.fn(),
      copy: jest.fn(),
      delete: jest.fn(),
      move: jest.fn(async () => {}),
    }))
    mockNewerRemote()

    const result = await refreshDbNow()

    expect(result).toBe(DbUpdateResult.UpToDate)
    const openArgs = mockOpenDatabaseAsync.mock.calls.map(call => call[0])
    expect(openArgs).not.toContain(TAGS_DB_NAME)
  })

  it('returns Unavailable (not a rejection) when the download fails', async () => {
    // Manual refresh must surface a friendly result, not throw, on network failure.
    mockGetUrl.mockImplementation(async (url: string) => {
      if (url.endsWith('manifest.json')) {
        return {
          generated_at_epoch_seconds: 2000,
          db_name_by_version: { 1: 'tags_db_v1.sqlite.otf' },
        } as any
      }
      throw new Error('network down')
    })

    await expect(refreshDbNow()).resolves.toBe(DbUpdateResult.Unavailable)
  })

  it('force: re-downloads and reopens even when the local DB looks current', async () => {
    // On-disk manifest is NEWER than the remote, so a normal refresh would say
    // "up to date". Force must still download and re-adopt -- this is the recovery
    // path for a stale/corrupted local DB.
    mockFile.mockImplementation((uri: string) => ({
      exists: true,
      uri,
      text: jest.fn(async () => JSON.stringify({ generated_at_epoch_seconds: 9999 })),
      write: jest.fn(),
      copy: jest.fn(),
      delete: jest.fn(),
      move: jest.fn(async () => {}),
    }))
    mockNewerRemote() // remote generated_at 2000 < local 9999

    const result = await refreshDbNow(true)

    expect(result).toBe(DbUpdateResult.Updated)
    // It actually downloaded the DB (not just the manifest) and reopened the connection.
    const dbFetches = mockGetUrl.mock.calls.filter(c => String(c[0]).endsWith('.otf'))
    expect(dbFetches).toHaveLength(1)
    const openArgs = mockOpenDatabaseAsync.mock.calls.map(call => call[0])
    expect(openArgs).toContain(TAGS_DB_NAME)
  })

  it('recovers (not Unavailable) when the local manifest is missing', async () => {
    // The user-facing half of the same regression: with no readable local manifest the
    // refresh used to report Unavailable, which the Data screen showed as a server
    // problem even though the network was fine. It must actually recover instead.
    mockFile.mockImplementation((uri: string) => ({
      exists: true,
      uri,
      text: jest.fn(async () => {
        throw new Error('ENOENT')
      }),
      write: jest.fn(),
      copy: jest.fn(),
      delete: jest.fn(),
      move: jest.fn(async () => {}),
    }))
    mockNewerRemote()

    const result = await refreshDbNow(true)

    expect(result).toBe(DbUpdateResult.Updated)
    // And the recovered DB is adopted into the running app.
    const openArgs = mockOpenDatabaseAsync.mock.calls.map(call => call[0])
    expect(openArgs).toContain(TAGS_DB_NAME)
  })

  it('serializes concurrent refreshes so their downloads never overlap', async () => {
    // The startup check and a manual refresh (or a double-tap) must not run two
    // downloads into the same tmp file at once.
    let active = 0
    let maxActive = 0
    mockGetUrl.mockImplementation(async (url: string) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise(setImmediate) // hold the "request" open across a tick
      active -= 1
      if (url.endsWith('manifest.json')) {
        return {
          generated_at_epoch_seconds: 2000,
          db_name_by_version: { 1: 'tags_db_v1.sqlite.otf' },
        } as any
      }
      return new ArrayBuffer(100) as any
    })

    const [a, b] = await Promise.all([refreshDbNow(true), refreshDbNow(true)])

    expect(a).toBe(DbUpdateResult.Updated)
    expect(b).toBe(DbUpdateResult.Updated)
    // Never more than one update operation touching the network at a time.
    expect(maxActive).toBe(1)
  })
})

describe('getDbConnection', () => {
  let defaultFileImpl: any
  // Each open returns a distinct object so tests can assert *which* connection a
  // caller was handed, not just that it got something.
  let openId: number

  /** Opens of the live DB name, ignoring the `.tmp` opens used to validate downloads. */
  const liveOpens = () =>
    mockOpenDatabaseAsync.mock.calls.filter(call => call[0] === TAGS_DB_NAME).length

  const healthyDb = () => ({
    id: (openId += 1),
    getAllAsync: async () => [{ count: 6975 }],
    closeAsync: async () => {},
  })

  beforeEach(() => {
    mockGetUrl.mockReset()
    mockOpenDatabaseAsync.mockReset()
    __resetDbStateForTest()
    defaultFileImpl = mockFile.getMockImplementation()
    openId = 0

    // The remote advertises no DB for our schema version, so the background update
    // check that initializeDbConnection fires resolves quietly without downloading.
    mockGetUrl.mockResolvedValue({
      generated_at_epoch_seconds: 2000,
      db_name_by_version: {},
    } as any)

    mockOpenDatabaseAsync.mockImplementation(async () => healthyDb())
  })

  afterEach(() => {
    mockFile.mockImplementation(defaultFileImpl)
    __resetDbStateForTest()
  })

  it('runs one initialization for callers that arrive together', async () => {
    // The memo holds the in-flight *promise*, not the resolved connection, so callers
    // that arrive in the same tick share one attempt instead of each kicking off their
    // own run of the delete-and-move seeding logic.
    const [a, b, c] = await Promise.all([getDbConnection(), getDbConnection(), getDbConnection()])
    await settle()

    expect(a).toBe(b)
    expect(b).toBe(c)
    // A single initialization: one probe open (currentDbHasTags) + one open to hand out.
    expect(liveOpens()).toBe(2)
  })

  it('reuses the connection on later calls instead of reinitializing', async () => {
    const first = await getDbConnection()
    const second = await getDbConnection()
    await settle()

    expect(second).toBe(first)
    expect(liveOpens()).toBe(2)
  })

  it('retries initialization on the next call after a failure', async () => {
    // Regression: a rejected attempt used to stay cached on the singleton forever, so
    // every later caller re-threw the same error and the only fix was an app restart.
    // A transient failure (Metro not up yet, momentary FS error) must be recoverable.
    let failOpen = true
    mockOpenDatabaseAsync.mockImplementation(async (name: string) => {
      if (name === TAGS_DB_NAME && failOpen) throw new Error('disk on fire')
      return healthyDb()
    })

    await expect(getDbConnection()).rejects.toThrow('disk on fire')

    failOpen = false
    await expect(getDbConnection()).resolves.toBeDefined()
    await settle()
  })

  it('shares one failed attempt among callers that arrive together', async () => {
    // Clearing the singleton on failure must not let simultaneous callers each start
    // their own initialization -- that would run the file delete/move logic
    // concurrently, the exact hazard the memo exists to prevent.
    mockOpenDatabaseAsync.mockImplementation(async (name: string) => {
      if (name === TAGS_DB_NAME) throw new Error('disk on fire')
      return healthyDb()
    })

    const results = await Promise.allSettled([
      getDbConnection(),
      getDbConnection(),
      getDbConnection(),
    ])
    await settle()

    expect(results.map(r => r.status)).toEqual(['rejected', 'rejected', 'rejected'])
    // One attempt total, not three: the probe open plus the open that threw.
    expect(liveOpens()).toBe(2)
  })

  it('a late-failing attempt does not discard a connection refreshDbNow installed', async () => {
    // refreshDbNow can adopt a healthy connection while a doomed initialization is
    // still in flight. When that attempt finally fails it must only clear the
    // singleton if it still owns it -- otherwise it throws away the just-refreshed
    // connection and forces a needless re-initialization.
    let releaseDoomedOpen: () => void = () => {}
    const doomedOpen = new Promise<void>(resolve => {
      releaseDoomedOpen = resolve
    })
    let opens = 0
    mockOpenDatabaseAsync.mockImplementation(async (name: string) => {
      if (name === TAGS_DB_NAME) {
        opens += 1
        // Open 1 is the currentDbHasTags probe; open 2 is the initialization's real
        // openConnection(). Park that one so the refresh below lands mid-flight.
        if (opens === 2) {
          await doomedOpen
          throw new Error('disk on fire')
        }
      }
      return healthyDb()
    })

    // The remote does have a DB for our schema version, so a forced refresh reports Updated.
    mockGetUrl.mockImplementation(async (url: string) => {
      if (url.endsWith(MANIFEST_NAME)) {
        return {
          generated_at_epoch_seconds: 2000,
          db_name_by_version: { [VALID_SCHEMA_VERSION]: 'tags_db_v1.sqlite.otf' },
        } as any
      }
      return new ArrayBuffer(100) as any
    })

    const doomed = getDbConnection()
    // Attach a handler now so the eventual rejection is never an unhandled one.
    const doomedError = doomed.catch(e => e)
    await settle()

    await expect(refreshDbNow(true)).resolves.toBe(DbUpdateResult.Updated)
    const adopted = await getDbConnection()

    // Now let the original attempt fail, well after the refresh replaced it.
    releaseDoomedOpen()
    expect((await doomedError).message).toBe('disk on fire')
    await settle()

    const opensAfterFailure = opens
    expect(await getDbConnection()).toBe(adopted)
    // Still handing out the refreshed connection, with no re-initialization.
    expect(opens).toBe(opensAfterFailure)
  })
})
