// Safe key-value storage. WKWebView (Capacitor iOS) supports localStorage, but
// access can throw in private/restricted contexts — every call is guarded so a
// storage failure never crashes the app. Swap the implementation for
// @capacitor/preferences later without touching callers.

export interface KeyValueStorage {
  get(key: string): string | null
  set(key: string, value: string): boolean
  remove(key: string): void
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

const memory = new Map<string, string>()

export const storage: KeyValueStorage = {
  get(key) {
    if (hasLocalStorage()) {
      try {
        return window.localStorage.getItem(key)
      } catch {
        return memory.get(key) ?? null
      }
    }
    return memory.get(key) ?? null
  },
  set(key, value) {
    memory.set(key, value)
    if (hasLocalStorage()) {
      try {
        window.localStorage.setItem(key, value)
        return true
      } catch {
        // quota exceeded / restricted context — caller surfaces this to the user
        return false
      }
    }
    // No web storage at all (tests, some embedded contexts): in-memory is the store.
    return true
  },
  remove(key) {
    memory.delete(key)
    if (hasLocalStorage()) {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    }
  },
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now().toString(36)}_${rand}`
}
