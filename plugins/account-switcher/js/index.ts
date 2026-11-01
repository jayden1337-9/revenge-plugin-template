/**
 * Revenge Account Switcher
 * Safe foundation only: no token, cookie, password or session extraction.
 * Actual switching remains disabled until an official host API is available.
 */
type AccountProfile = {
  id: string
  username: string
  avatarUrl?: string
  addedAt: number
}

const STORAGE_KEY = 'dev.jayden.account-switcher.profiles'

function isAccountProfile(value: unknown): value is AccountProfile {
  if (!value || typeof value !== 'object') return false
  const profile = value as Record<string, unknown>
  return typeof profile.id === 'string'
    && typeof profile.username === 'string'
    && typeof profile.addedAt === 'number'
    && (profile.avatarUrl === undefined || typeof profile.avatarUrl === 'string')
}

export default plugin({
  start() {
    console.log('[account-switcher] loaded')
    console.log('[account-switcher] session switching disabled: no supported host API')
  },
  stop() {
    console.log('[account-switcher] unloaded')
  },
})

export { STORAGE_KEY, isAccountProfile }
export type { AccountProfile }
