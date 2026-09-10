import type { BellatrixRepo } from './types'
import { LocalRepo } from './localRepo'
import { SupabaseRepo } from './supabaseRepo'

export type { BellatrixRepo, RepoMode, DatasetWindow, NewRow, SignInParams } from './types'
export { RepoError } from './types'

let instance: BellatrixRepo | null = null

export function getRepo(): BellatrixRepo {
  if (instance) return instance
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (url && key && url.startsWith('https://')) {
    instance = new SupabaseRepo(url, key)
  } else {
    instance = new LocalRepo()
  }
  return instance
}
