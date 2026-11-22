/**
 * Unsent form drafts, kept on this device so a half-filled form survives a
 * phone call, a closed sheet or the browser killing the tab.
 *
 * IndexedDB when available, localStorage otherwise (some private modes).
 * Every call swallows storage errors: a draft is a convenience, never a
 * reason for a form to break.
 */

export interface DraftRecord<T = unknown> {
  key: string
  values: T
  step?: number
  updatedAt: number
}

const DB_NAME = "autolead-drafts"
const STORE = "drafts"
const LS_PREFIX = "autolead-draft:"
/** Drafts older than this are dropped. */
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000

type Listener = (key: string) => void
const listeners = new Set<Listener>()

/** Notified with the key whenever a draft is written or deleted. */
export function subscribeDrafts(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(key: string) {
  for (const l of listeners) l(key)
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null)
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE, { keyPath: "key" })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

function tx<R>(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<R>): Promise<R | undefined> {
  return new Promise((resolve) => {
    try {
      const req = run(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(undefined)
    } catch {
      resolve(undefined)
    }
  })
}

function lsGet<T>(key: string): DraftRecord<T> | undefined {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    return raw ? (JSON.parse(raw) as DraftRecord<T>) : undefined
  } catch {
    return undefined
  }
}

function lsKeys(): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(LS_PREFIX)) keys.push(k.slice(LS_PREFIX.length))
    }
    return keys
  } catch {
    return []
  }
}

function isFresh(record: DraftRecord | undefined, now = Date.now()): boolean {
  return !!record && now - record.updatedAt < DRAFT_TTL_MS
}

export async function getDraft<T>(key: string): Promise<DraftRecord<T> | null> {
  const db = await openDb()
  const record = db
    ? await tx<DraftRecord<T> | undefined>(db, "readonly", (s) => s.get(key))
    : lsGet<T>(key)
  if (!record) return null
  if (!isFresh(record)) {
    void deleteDraft(key)
    return null
  }
  return record
}

export async function putDraft<T>(key: string, values: T, step?: number): Promise<void> {
  const record: DraftRecord<T> = { key, values, step, updatedAt: Date.now() }
  const db = await openDb()
  if (db) {
    // Structured clone can't take functions/class instances; fall back to plain JSON.
    let plain: DraftRecord<T> = record
    try {
      plain = JSON.parse(JSON.stringify(record)) as DraftRecord<T>
    } catch {
      return
    }
    await tx(db, "readwrite", (s) => s.put(plain))
  } else {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(record))
    } catch {
      return
    }
  }
  emit(key)
}

export async function deleteDraft(key: string): Promise<void> {
  const db = await openDb()
  if (db) await tx(db, "readwrite", (s) => s.delete(key))
  else {
    try {
      localStorage.removeItem(LS_PREFIX + key)
    } catch {
      // ignore
    }
  }
  emit(key)
}

async function allKeys(): Promise<string[]> {
  const db = await openDb()
  if (!db) return lsKeys()
  return ((await tx<IDBValidKey[]>(db, "readonly", (s) => s.getAllKeys())) ?? []).map(String)
}

/** Deletes every draft whose key starts with `prefix` (e.g. on sign-out). */
export async function deleteDraftsWithPrefix(prefix: string): Promise<void> {
  const keys = (await allKeys()).filter((k) => k.startsWith(prefix))
  await Promise.all(keys.map(deleteDraft))
}

/** Drops drafts past their TTL. Cheap; run once per session. */
export async function pruneDrafts(now = Date.now()): Promise<void> {
  const db = await openDb()
  const records = db
    ? ((await tx<DraftRecord[]>(db, "readonly", (s) => s.getAll())) ?? [])
    : lsKeys().map((k) => lsGet(k)).filter((r): r is DraftRecord => !!r)
  await Promise.all(records.filter((r) => !isFresh(r, now)).map((r) => deleteDraft(r.key)))
}

/** For tests: forget the cached connection. */
export function __resetDraftStoreForTests() {
  dbPromise = null
  listeners.clear()
}
