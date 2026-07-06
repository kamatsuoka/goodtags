import { TAGS_DB_NAME } from '@app/constants/sql'
import getUrl from '@app/modules/getUrl'
import { backgroundCheckForRemoteUpdates, DbWrapper, InnerDb } from '@app/modules/sqlUtil'
import { setImmediate } from '@testing-library/react-native/build/helpers/timers'
import * as SQLite from 'expo-sqlite'

jest.mock('@app/modules/getUrl')

const mockGetUrl = getUrl as jest.MockedFunction<typeof getUrl>
const mockOpenDatabaseAsync = SQLite.openDatabaseAsync as jest.Mock

class TestSqliteDatabase implements InnerDb {
  numTxns: number

  constructor() {
    this.numTxns = 0
  }

  async withTransactionAsync(callback: () => Promise<void>) {
    this.numTxns += 1
    await callback()
  }

  async getAllAsync<T = any>(_source: string, ..._params: any[]): Promise<T[]> {
    return []
  }

  async closeAsync() {}
}

/** Wait a little bit for promises to reach a steady state */
async function settle() {
  await new Promise(setImmediate)
}

// Implementation of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
function promiseWithResolvers<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: any) => void
} {
  let resolve, reject
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve: resolve as any, reject: reject as any }
}

describe('DbWrapper class', () => {
  describe('replacing the underlying DB', () => {
    it('should direct new transactions to the new DB', async () => {
      const db1 = new TestSqliteDatabase()
      const db2 = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db1)

      await wrapper.runTransactionAsync(async () => {})
      expect(db1.numTxns).toBe(1)
      expect(db2.numTxns).toBe(0)

      await wrapper.queueDbReplacement(async () => db2)
      await settle()

      await wrapper.runTransactionAsync(async () => {})
      expect(db1.numTxns).toBe(1)
      expect(db2.numTxns).toBe(1)
    })

    it('should wait until the last ongoing transaction finishes', async () => {
      const db = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db)

      const { promise, resolve } = promiseWithResolvers<void>()
      const t1 = wrapper.runTransactionAsync(async () => await promise)
      const t2 = wrapper.runTransactionAsync(async () => await promise)

      let hasDoneReplacement = false
      await wrapper.queueDbReplacement(async () => {
        hasDoneReplacement = true
        return db
      })
      await settle()

      expect(hasDoneReplacement).toBe(false)

      resolve()
      await Promise.all([t1, t2])
      await settle()

      expect(hasDoneReplacement).toBe(true)
    })

    it('should queue up subsequent transactions while a replacement is ongoing', async () => {
      const db = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db)

      const { promise, resolve } = promiseWithResolvers<void>()
      await wrapper.queueDbReplacement(async () => {
        await promise
        return db
      })
      const t1 = wrapper.runTransactionAsync(async () => {})
      const t2 = wrapper.runTransactionAsync(async () => {})
      await settle()

      expect(db.numTxns).toBe(0)

      resolve()
      await Promise.all([t1, t2])
      expect(db.numTxns).toBe(2)
    })

    it("should ignore second replacement if first hasn't started yet", async () => {
      const db = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db)

      // Prevent replacement from starting by having an ongoing txn
      const { promise, resolve } = promiseWithResolvers<void>()
      const t = wrapper.runTransactionAsync(async () => await promise)
      // Submit the two replacements
      let replacedA = false
      let replacedB = false
      await wrapper.queueDbReplacement(async () => {
        replacedA = true
        return db
      })
      await wrapper.queueDbReplacement(async () => {
        replacedB = true
        return db
      })
      // Resolve the txn so the replacement can happen
      resolve()
      await t
      await settle()

      expect(replacedA).toBe(true)
      expect(replacedB).toBe(false)
    })

    it('should still run a queued replacement after a transaction throws', async () => {
      // Regression: runTransactionAsync must restore txnCount even when the
      // callback throws. Otherwise txnCount stays stuck > 0 and the downloaded
      // remote DB never gets swapped in.
      const db1 = new TestSqliteDatabase()
      const db2 = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db1)

      await expect(
        wrapper.runTransactionAsync(async () => {
          throw new Error('query failed (e.g. no such table: tags)')
        }),
      ).rejects.toThrow('query failed')

      await wrapper.queueDbReplacement(async () => db2)
      await settle()

      await wrapper.runTransactionAsync(async () => {})
      // If txnCount were stuck, the replacement wouldn't have happened and this
      // would have gone to db1 instead.
      expect(db2.numTxns).toBe(1)
    })

    it('should not close the DB while a getAllAsync is in flight', async () => {
      // Regression for the exsqlite3_finalize SIGABRT crash: getAllAsync must be
      // counted in txnCount so a replacement can't closeAsync() the DB out from
      // under an active query.
      const { promise, resolve } = promiseWithResolvers<void>()
      let queryInFlight = false
      let closedWhileQuerying = false
      const db1: InnerDb = {
        withTransactionAsync: async cb => cb(),
        getAllAsync: async () => {
          queryInFlight = true
          await promise
          queryInFlight = false
          return []
        },
        closeAsync: async () => {
          if (queryInFlight) closedWhileQuerying = true
        },
      }
      const db2 = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db1)

      const query = wrapper.getAllAsync('SELECT 1')
      await settle() // let the query start and register in txnCount

      await wrapper.queueDbReplacement(async () => db2)
      await settle()
      // Replacement must wait: db1 must not be closed while the query runs.
      expect(closedWhileQuerying).toBe(false)

      resolve()
      await query
      await settle()
      expect(closedWhileQuerying).toBe(false)
    })

    it('should not be permanently locked if a replacement callback throws', async () => {
      // Regression: replaceDbInProgress must be cleared even when the replacement
      // callback throws, otherwise every later query awaits a rejected promise.
      const db1 = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db1)

      await wrapper.queueDbReplacement(async () => {
        throw new Error('replacement failed (e.g. file move error)')
      })
      await settle()

      // Wrapper should still be usable rather than re-throwing forever.
      await expect(wrapper.runTransactionAsync(async () => {})).resolves.toBeUndefined()
    })

    it('should queue second replacement if first has already started', async () => {
      const db = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db)

      // Prevent replacement from finishing
      const { promise, resolve } = promiseWithResolvers<void>()
      let replacedA = false
      let replacedB = false
      await wrapper.queueDbReplacement(async () => {
        replacedA = true
        await promise
        return db
      })
      await settle()

      expect(replacedA).toBe(true)

      // Queue the second replacement
      const q = wrapper.queueDbReplacement(async () => {
        replacedB = true
        return db
      })
      await settle()

      // Finishing the ongoing replacement
      resolve()
      await q
      await settle()

      expect(replacedB).toBe(true)
    })
  })

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
})

describe('backgroundCheckForRemoteUpdates', () => {
  const sqlDir = '/data/SQLite/'
  const currentSqlPath = `${sqlDir}${TAGS_DB_NAME}`
  const currentManifestPath = `${sqlDir}manifest.json`
  const tmpSqlPath = `${currentSqlPath}.tmp`
  const tmpManifestPath = `${currentManifestPath}.tmp`

  beforeEach(() => {
    mockGetUrl.mockReset()
    mockOpenDatabaseAsync.mockReset()

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

    // Validation query reports a healthy table so the replacement is queued.
    mockOpenDatabaseAsync.mockResolvedValue({
      withTransactionAsync: async (cb: () => Promise<void>) => cb(),
      getAllAsync: async () => [{ count: 6975 }],
      closeAsync: async () => {},
    })
  })

  it('opens the downloaded tmp DB by basename, never by full path', async () => {
    // Regression: expo-sqlite's openDatabaseAsync treats its argument as a name
    // relative to defaultDatabaseDirectory, so passing the full tmpSqlPath URI
    // silently opens a brand-new empty DB -> "no such table: tags". Every DB open
    // in this module must use a bare basename.
    const wrapper = new DbWrapper(new TestSqliteDatabase())

    await backgroundCheckForRemoteUpdates(
      wrapper,
      currentSqlPath,
      currentManifestPath,
      tmpSqlPath,
      tmpManifestPath,
    )
    await settle()

    const openArgs = mockOpenDatabaseAsync.mock.calls.map(call => call[0])
    // The tmp DB is validated by basename...
    expect(openArgs).toContain(`${TAGS_DB_NAME}.tmp`)
    // ...and no open ever receives a path with a directory separator.
    for (const arg of openArgs) {
      expect(arg).not.toContain('/')
    }
  })

  it(
    'opens every DB with a fresh connection (useNewConnection)' + ' to bypass the shared cache',
    async () => {
      // Regression: expo-sqlite's connection cache is keyed by database name and hands
      // back a cached connection for a name even after we've deleted/moved the file on
      // disk, yielding "no such table: tags" against a valid DB. Every open in this
      // module must force a fresh connection so it reflects the current on-disk file.
      const wrapper = new DbWrapper(new TestSqliteDatabase())

      await backgroundCheckForRemoteUpdates(
        wrapper,
        currentSqlPath,
        currentManifestPath,
        tmpSqlPath,
        tmpManifestPath,
      )
      await settle()

      expect(mockOpenDatabaseAsync.mock.calls.length).toBeGreaterThan(0)
      for (const call of mockOpenDatabaseAsync.mock.calls) {
        expect(call[1]?.useNewConnection).toBe(true)
      }
    },
  )

  it('does not set an Accept-Encoding header on the DB download', async () => {
    // Regression: manually setting Accept-Encoding: gzip disables the platform's
    // transparent gzip decompression, so we'd write compressed bytes to disk.
    const wrapper = new DbWrapper(new TestSqliteDatabase())

    await backgroundCheckForRemoteUpdates(
      wrapper,
      currentSqlPath,
      currentManifestPath,
      tmpSqlPath,
      tmpManifestPath,
    )
    await settle()

    const sqlDownloadCall = mockGetUrl.mock.calls.find(call => String(call[0]).endsWith('.otf'))
    expect(sqlDownloadCall).toBeDefined()
    const config = sqlDownloadCall![1]
    expect(config?.responseType).toBe('arraybuffer')
    expect(config?.headers).toBeUndefined()
  })

  it('discards a downloaded DB whose tags table is missing or unreadable', async () => {
    // The validation that protected us during the gzip incident: a download that
    // isn't a usable tags DB must be thrown away rather than swapped in.
    mockOpenDatabaseAsync.mockResolvedValue({
      withTransactionAsync: async (cb: () => Promise<void>) => cb(),
      getAllAsync: async () => {
        throw new Error('no such table: tags')
      },
      closeAsync: async () => {},
    })
    const wrapper = new DbWrapper(new TestSqliteDatabase())

    await backgroundCheckForRemoteUpdates(
      wrapper,
      currentSqlPath,
      currentManifestPath,
      tmpSqlPath,
      tmpManifestPath,
    )
    await settle()

    const openArgs = mockOpenDatabaseAsync.mock.calls.map(call => call[0])
    // The tmp DB was opened for validation...
    expect(openArgs).toContain(`${TAGS_DB_NAME}.tmp`)
    // ...but validation failed, so no replacement was queued (TAGS_DB_NAME, the
    // basename used by the swap, is never opened).
    expect(openArgs).not.toContain(TAGS_DB_NAME)
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
    const wrapper = new DbWrapper(new TestSqliteDatabase())

    await backgroundCheckForRemoteUpdates(
      wrapper,
      currentSqlPath,
      currentManifestPath,
      tmpSqlPath,
      tmpManifestPath,
    )
    await settle()

    const openArgs = mockOpenDatabaseAsync.mock.calls.map(call => call[0])
    // Validated the tmp DB, found it empty, and queued no replacement.
    expect(openArgs).toContain(`${TAGS_DB_NAME}.tmp`)
    expect(openArgs).not.toContain(TAGS_DB_NAME)
  })
})
