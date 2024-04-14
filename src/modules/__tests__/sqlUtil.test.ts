import {DbWrapper, InnerDb} from "@app/modules/sqlUtil"
import {setImmediate} from "@testing-library/react-native/build/helpers/timers"
import {SQLTransactionAsync, SQLTransactionAsyncCallback} from "expo-sqlite"

class TestSqliteDatabase implements InnerDb {
  numTxns: number

  constructor() {
    this.numTxns = 0
  }

  async transactionAsync(
    callback: SQLTransactionAsyncCallback,
    _readOnly: boolean = false,
  ) {
    this.numTxns += 1
    // Absolutely a hack, it's assumed the txn is never used in tests
    await callback({} as SQLTransactionAsync)
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
  return {promise, resolve: resolve as any, reject: reject as any}
}

describe("DbWrapper class", () => {
  describe("replacing the underlying DB", () => {
    it("should direct new transactions to the new DB", async () => {
      const db1 = new TestSqliteDatabase()
      const db2 = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db1)

      await wrapper.runTransactionAsync(async _ => {}, true)
      expect(db1.numTxns).toBe(1)
      expect(db2.numTxns).toBe(0)

      await wrapper.queueDbReplacement(async () => db2)
      await settle()

      await wrapper.runTransactionAsync(async _ => {}, true)
      expect(db1.numTxns).toBe(1)
      expect(db2.numTxns).toBe(1)
    })

    it("should wait until the last ongoing transaction finishes", async () => {
      const db = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db)

      const {promise, resolve} = promiseWithResolvers<void>()
      const t1 = wrapper.runTransactionAsync(async _ => await promise, true)
      const t2 = wrapper.runTransactionAsync(async _ => await promise, true)

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

    it("should queue up subsequent transactions while a replacement is ongoing", async () => {
      const db = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db)

      const {promise, resolve} = promiseWithResolvers<void>()
      await wrapper.queueDbReplacement(async () => {
        await promise
        return db
      })
      const t1 = wrapper.runTransactionAsync(async _ => {}, true)
      const t2 = wrapper.runTransactionAsync(async _ => {}, true)
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
      const {promise, resolve} = promiseWithResolvers<void>()
      const t = wrapper.runTransactionAsync(async _ => await promise, true)
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

    it("should queue second replacement if first has already started", async () => {
      const db = new TestSqliteDatabase()
      const wrapper = new DbWrapper(db)

      // Prevent replacement from finishing
      const {promise, resolve} = promiseWithResolvers<void>()
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
})
