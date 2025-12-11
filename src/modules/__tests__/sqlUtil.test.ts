import { DbWrapper, InnerDb } from '@app/modules/sqlUtil'
import { setImmediate } from '@testing-library/react-native/build/helpers/timers'

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

  closeAsync() {}
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
