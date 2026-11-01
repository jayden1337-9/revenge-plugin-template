import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'

type SavedAccount = { id: string; username: string; avatarUrl?: string; addedAt: number }
type AccountStorage = { accounts: SavedAccount[]; activeAccountId: string | null }
const DEFAULT_STORAGE: AccountStorage = { accounts: [], activeAccountId: null }

function validAvatar(value: string) {
  if (!value.trim()) return undefined
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch { return undefined }
}

function AccountSwitcherSettings({ api }: { api: any }) {
  const storage = api.jsonStorage
  const stored = storage.use() as AccountStorage | undefined
  const accounts = stored?.accounts ?? []
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')
  const [avatar, setAvatar] = useState('')
  const [notice, setNotice] = useState('')
  const sorted = useMemo(() => [...accounts].sort((a,b) => a.username.localeCompare(b.username)), [accounts])
  const styles = {
    page: { padding: 16, gap: 12, backgroundColor: '#202127' },
    title: { color: '#fff', fontSize: 21, fontWeight: '700' as const },
    text: { color: '#b9bac4', fontSize: 13, lineHeight: 19 },
    field: { color: '#fff', backgroundColor: '#30323b', borderRadius: 9, padding: 12 },
    card: { backgroundColor: '#30323b', borderRadius: 12, padding: 12, gap: 7 },
    name: { color: '#fff', fontSize: 15, fontWeight: '600' as const },
    button: { backgroundColor: '#5865f2', borderRadius: 9, padding: 12, alignItems: 'center' as const },
    danger: { backgroundColor: '#8e3945', borderRadius: 8, padding: 9, alignItems: 'center' as const },
    disabled: { backgroundColor: '#454752', borderRadius: 8, padding: 9, alignItems: 'center' as const },
  }
  async function addProfile() {
    const name = username.trim().slice(0, 80)
    const id = userId.trim()
    if (!name || !/^\d{5,25}$/.test(id)) { setNotice('Enter a username and numeric Discord user ID.'); return }
    if (accounts.some(a => a.id === id)) { setNotice('That profile is already saved.'); return }
    const next: SavedAccount = { id, username: name, avatarUrl: validAvatar(avatar), addedAt: Date.now() }
    await storage.set({ accounts: [...accounts, next], activeAccountId: stored?.activeAccountId ?? null }, true)
    setUsername(''); setUserId(''); setAvatar('')
    setNotice('Profile saved on this device.')
  }
  async function removeProfile(id: string) {
    await storage.set({
      accounts: accounts.filter(a => a.id !== id),
      activeAccountId: stored?.activeAccountId === id ? null : (stored?.activeAccountId ?? null),
    }, true)
    setNotice('Profile removed. Discord login was not changed.')
  }
  return React.createElement(ScrollView, { contentContainerStyle: styles.page },
    React.createElement(Text, { style: styles.title }, 'Account Switcher'),
    React.createElement(Text, { style: styles.text }, 'Manage saved account profiles. Actual Discord session switching is unavailable because the public plugin API does not expose a supported session-switch method.'),
    React.createElement(Text, { style: styles.name }, 'Add account profile'),
    React.createElement(TextInput, { value: username, onChangeText: setUsername, placeholder: 'Discord username', placeholderTextColor: '#92949f', style: styles.field, autoCapitalize: 'none' }),
    React.createElement(TextInput, { value: userId, onChangeText: setUserId, placeholder: 'Discord user ID', placeholderTextColor: '#92949f', style: styles.field, keyboardType: 'number-pad' }),
    React.createElement(TextInput, { value: avatar, onChangeText: setAvatar, placeholder: 'Avatar URL (optional, HTTPS)', placeholderTextColor: '#92949f', style: styles.field, autoCapitalize: 'none' }),
    React.createElement(Pressable, { onPress: addProfile, style: styles.button }, React.createElement(Text, { style: { color: '#fff', fontWeight: '700' } }, 'Save profile')),
    notice ? React.createElement(Text, { style: styles.text }, notice) : null,
    React.createElement(Text, { style: styles.name }, 'Saved profiles (' + accounts.length + ')'),
    ...sorted.map(account => React.createElement(View, { key: account.id, style: styles.card },
      React.createElement(Text, { style: styles.name }, account.username),
      React.createElement(Text, { style: styles.text }, 'User ID: ' + account.id),
      React.createElement(Pressable, { disabled: true, style: styles.disabled }, React.createElement(Text, { style: styles.text }, 'Switch unavailable')),
      React.createElement(Pressable, { onPress: () => removeProfile(account.id), style: styles.danger }, React.createElement(Text, { style: { color: '#fff', fontWeight: '700' } }, 'Remove profile')),
    )),
    React.createElement(Text, { style: styles.text }, 'Only non-secret profile metadata is stored. Discord retains responsibility for credentials and authentication. Removing a profile here does not log out of Discord.'),
  )
}

export default plugin({
  jsonStorage: { file: 'accounts.json', default: DEFAULT_STORAGE, load: true },
  SettingsComponent: AccountSwitcherSettings,
  start() { console.log('[account-switcher] profile manager ready') },
  stop() { console.log('[account-switcher] stopped') },
})
