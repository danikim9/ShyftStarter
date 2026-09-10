// Product analytics events (section 30). Stored in the app database via the
// repository so pilot engagement can be analysed without a third-party SDK.
import type { ProductEventName } from '../types/bellatrix'
import { getRepo } from './repo'

type Props = Record<string, string | number | boolean | null>

export function track(userId: string | null, name: ProductEventName, properties: Props = {}): void {
  if (!userId) return
  const repo = getRepo()
  void repo
    .trackEvent({ user_id: userId, event_name: name, occurred_at: new Date().toISOString(), properties })
    .catch((e: unknown) => {
      if (import.meta.env.DEV) console.warn('[track] failed', name, e)
    })
  if (import.meta.env.DEV) console.debug('[track]', name, properties)
}
