const DB_NAME = "oratoria-recordings";
const STORE = "recordings";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const recordings = {
  async save(id: string, blob: Blob) {
    await tx("readwrite", (s) => s.put(blob, id));
  },
  async load(id: string): Promise<Blob | null> {
    try {
      return (await tx<Blob | undefined>("readonly", (s) => s.get(id))) ?? null;
    } catch {
      return null;
    }
  },
  async remove(id: string) {
    try {
      await tx("readwrite", (s) => s.delete(id));
    } catch {
      /* noop */
    }
  },
};
