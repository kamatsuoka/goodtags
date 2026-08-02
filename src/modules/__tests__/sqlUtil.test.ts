import { TAGS_DB_NAME } from '@app/constants/sql'
import getUrl from '@app/modules/getUrl'
import { backgroundCheckForRemoteUpdates } from '@app/modules/sqlUtil'
import { setImmediate } from '@testing-library/react-native/build/helpers/timers'
import { File } from 'expo-file-system'
import * as SQLite from 'expo-sqlite'

jest.mock('@app/modules/getUrl')

const mockGetUrl = getUrl as jest.MockedFunction<typeof getUrl>
const mockOpenDatabaseAsync = SQLite.openDatabaseAsync as jest.Mock
const mockFile = File as unknown as jest.Mock

/** Wait a little bit for promises to reach a steady state */
async function settle() {
  await new Promise(setImmediate)
}

describe('file writing operations', () => {
  // mock binary sqlite database data (minimal valid sqlite header)
  const createMockSqliteData = (): ArrayBuffer => {
    // sqlite file format starts with "SQLite format 3\0"
    const header = 'SQLite format 3\0'
    const buffer = new ArrayBuffer(100)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < header.length; i++) {
      view[i] = header.charCodeAt(i)
    }
    return buffer
  }

  it('should write ArrayBuffer directly to file without base64 encoding', async () => {
    const mockData = createMockSqliteData()
    const mockFileWrite = jest.fn()

    // simulate writing binary data directly
    mockFileWrite.mockImplementation((data: ArrayBuffer | string) => {
      // verify we're receiving an ArrayBuffer, not a base64 string
      expect(data).toBeInstanceOf(ArrayBuffer)
      const view = new Uint8Array(data as ArrayBuffer)
      // verify it starts with sqlite magic header
      expect(String.fromCharCode(...Array.from(view.slice(0, 16)))).toContain('SQLite format 3')
    })

    // mock file writing function
    const writeBinaryFile = async (path: string, data: ArrayBuffer) => {
      const file = { write: mockFileWrite }
      file.write(data)
    }

    await writeBinaryFile('test.db', mockData)

    expect(mockFileWrite).toHaveBeenCalledTimes(1)
  })

  it('should produce identical binary output for base64 vs direct write', () => {
    const mockData = createMockSqliteData()

    // current approach: base64 encode then write with Base64 encoding flag
    const base64String = Buffer.from(mockData).toString('base64')
    const decodedFromBase64 = Buffer.from(base64String, 'base64')

    // proposed approach: write ArrayBuffer directly
    const directWrite = new Uint8Array(mockData)

    // verify both produce identical binary data
    expect(decodedFromBase64.length).toBe(directWrite.length)
    expect(Buffer.from(decodedFromBase64)).toEqual(Buffer.from(directWrite))
  })

  it('should verify base64 encoding adds ~33% overhead', () => {
    const mockData = createMockSqliteData()

    const originalSize = mockData.byteLength
    const base64String = Buffer.from(mockData).toString('base64')
    const base64Size = base64String.length

    // base64 encoding should increase size by approximately 33%
    const overhead = (base64Size - originalSize) / originalSize
    expect(overhead).toBeGreaterThan(0.3)
    expect(overhead).toBeLessThan(0.4)
  })

  it('should validate sqlite can read binary data written both ways', () => {
    const mockData = createMockSqliteData()

    // method 1: base64 round-trip
    const base64String = Buffer.from(mockData).toString('base64')
    const fromBase64Buffer = Buffer.from(base64String, 'base64')

    // method 2: direct binary
    const directBinary = mockData

    // both should have valid sqlite header
    const checkSqliteHeader = (buffer: ArrayBuffer | Buffer) => {
      const view = buffer instanceof Buffer ? buffer : new Uint8Array(buffer)
      const header = String.fromCharCode(...Array.from(view.slice(0, 16)))
      return header.startsWith('SQLite format 3')
    }

    expect(checkSqliteHeader(fromBase64Buffer)).toBe(true)
    expect(checkSqliteHeader(directBinary)).toBe(true)
  })
})

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
      withTransactionAsync: async (cb: () => Promise<void>) => cb(),
      getAllAsync: async () => [{ count: 6975 }],
      closeAsync: async () => {},
    })
  })

  afterEach(() => {
    mockFile.mockImplementation(defaultFileImpl)
  })

  it('stages the validated download into place for the next launch', async () => {
    await runCheck()
    await settle()

    // The validated tmp files are moved onto the current paths...
    expect(movedFrom).toEqual([tmpSqlPath, tmpManifestPath])
    // ...after the current files are deleted first (move does not overwrite).
    expect(deleted).toEqual([currentSqlPath, currentManifestPath])
  })

  it('never hot-swaps the live connection (opens no DB other than the tmp validation)', async () => {
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

  it('opens the tmp DB with a fresh connection (useNewConnection) to bypass the cache', async () => {
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
      withTransactionAsync: async (cb: () => Promise<void>) => cb(),
      getAllAsync: async () => {
        throw new Error('no such table: tags')
      },
      closeAsync: async () => {},
    })

    await runCheck()
    await settle()

    // Validation failed, so nothing is staged: the bad tmp download is deleted and no
    // file is moved onto the current paths.
    expect(movedFrom).toEqual([])
    expect(deleted).toContain(tmpSqlPath)
  })

  it('discards a downloaded DB whose tags table is empty (count 0)', async () => {
    // A structurally valid but zero-row DB must not replace the working DB. This is
    // belt-and-suspenders with the server-side floor in
    // scripts/fetch_search_database.py (MIN_EXPECTED_TAGS / MIN_FRACTION_OF_PREVIOUS).
    mockOpenDatabaseAsync.mockResolvedValue({
      withTransactionAsync: async (cb: () => Promise<void>) => cb(),
      getAllAsync: async () => [{ count: 0 }],
      closeAsync: async () => {},
    })

    await runCheck()
    await settle()

    expect(movedFrom).toEqual([])
    expect(deleted).toContain(tmpSqlPath)
  })
})
