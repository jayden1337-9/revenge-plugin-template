import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { callNativeMethod } from '@revenge-mod/modules/native'

const ID = 'dev.jayden.botclient'
const API = 'https://discord.com/api/v10'

type BotUser = {
  id: string
  username: string
  global_name?: string | null
  avatar?: string | null
  bot?: boolean
}

type GuildChannel = {
  id: string
  name: string
  type: number
  guild_id?: string
}

type Message = {
  id: string
  content: string
  timestamp: string
  author?: { username?: string; bot?: boolean }
}

type Notice = { text: string; bad?: boolean } | null

async function request<T>(
  token: string,
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'DiscordBot (RevengeBotClient, 0.1.0)',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch {}
  if (!response.ok) {
    const detail = data?.message || `HTTP ${response.status}`
    throw new Error(detail)
  }
  return data as T
}

const colors = {
  bg: '#232428',
  panel: '#2b2d31',
  panel2: '#313338',
  text: '#f2f3f5',
  muted: '#b5bac1',
  accent: '#5865f2',
  danger: '#ed4245',
  border: '#3f4147',
}

function Button({
  title, onPress, disabled, danger,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: danger ? '#6f252a' : colors.accent,
        opacity: disabled ? 0.5 : 1,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
      }}
    >
      <Text style={{ color: colors.text, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  )
}

function Field({
  value, onChangeText, placeholder, secureTextEntry, keyboardType,
}: {
  value: string
  onChangeText: (v: string) => void
  placeholder: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'numeric'
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#8e9297"
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize="none"
      autoCorrect={false}
      style={{
        backgroundColor: colors.panel2,
        color: colors.text,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
      }}
    />
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12, marginBottom: 2 }}>
      {children}
    </Text>
  )
}

function BotClientSettings({ api }: { api: any }) {
  const [token, setToken] = useState('')
  const [user, setUser] = useState<BotUser | null>(null)
  const [guildId, setGuildId] = useState('')
  const [guildName, setGuildName] = useState('')
  const [channels, setChannels] = useState<GuildChannel[]>([])
  const [channel, setChannel] = useState<GuildChannel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [connected, setConnected] = useState(false)
  const [accountMode, setAccountMode] = useState<'user' | 'bot'>('user')

  const textStyle = useMemo(() => ({ color: colors.text }), [])

  useEffect(() => {
    let live = true
    callNativeMethod(`${ID}.loadToken`, [])
      .then((saved: string) => {
        if (live && saved) setToken(saved)
      })
      .catch(() => {})
    return () => { live = false }
  }, [])

  async function connect(value = token) {
    const clean = value.trim()
    if (!clean) {
      setNotice({ text: 'Enter your bot token first.', bad: true })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      const me = await request<BotUser>(clean, '/users/@me')
      if (!me.bot) throw new Error('That token does not belong to a bot account.')
      await callNativeMethod(`${ID}.saveToken`, [clean])
      setToken(clean)
      setUser(me)
      setConnected(true)
      setNotice({ text: `Connected as ${me.username}. Token encrypted on this device.` })
    } catch (e: any) {
      setConnected(false)
      setUser(null)
      setNotice({ text: e?.message || 'Could not connect.', bad: true })
    } finally {
      setBusy(false)
    }
  }

  async function loadGuild() {
    if (!connected || !guildId.trim()) return
    setBusy(true)
    setNotice(null)
    try {
      const guild = await request<any>(token, `/guilds/${guildId.trim()}`)
      const list = await request<GuildChannel[]>(token, `/guilds/${guildId.trim()}/channels`)
      setGuildName(guild.name || guildId.trim())
      setChannels(list.filter(c => c.type === 0 || c.type === 5))
      setChannel(null)
      setMessages([])
      setNotice({ text: `Loaded ${guild.name || guildId}.` })
    } catch (e: any) {
      setNotice({ text: e?.message || 'Could not load server. Check the ID and bot permissions.', bad: true })
    } finally {
      setBusy(false)
    }
  }

  async function openChannel(item: GuildChannel) {
    setChannel(item)
    setMessages([])
    setBusy(true)
    setNotice(null)
    try {
      const rows = await request<Message[]>(token, `/channels/${item.id}/messages?limit=30`)
      setMessages(rows.reverse())
    } catch (e: any) {
      setNotice({ text: e?.message || 'Could not read messages in this channel.', bad: true })
    } finally {
      setBusy(false)
    }
  }

  async function sendMessage() {
    if (!channel || !draft.trim()) return
    setBusy(true)
    try {
      await request(token, `/channels/${channel.id}/messages`, 'POST', { content: draft.trim() })
      setDraft('')
      await openChannel(channel)
      setNotice({ text: 'Message sent.' })
    } catch (e: any) {
      setNotice({ text: e?.message || 'Could not send message.', bad: true })
    } finally {
      setBusy(false)
    }
  }

  async function saveNickname() {
    if (!guildId.trim() || !nickname.trim()) {
      setNotice({ text: 'Enter a server ID and nickname.', bad: true })
      return
    }
    setBusy(true)
    try {
      await request(token, `/guilds/${guildId.trim()}/members/@me`, 'PATCH', { nick: nickname.trim() })
      setNotice({ text: 'Server nickname updated.' })
    } catch (e: any) {
      setNotice({ text: e?.message || 'Could not change nickname. The bot needs the appropriate permission.', bad: true })
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    setBusy(true)
    try {
      await callNativeMethod(`${ID}.deleteToken`, [])
      setToken('')
      setUser(null)
      setConnected(false)
      setGuildId('')
      setGuildName('')
      setChannels([])
      setChannel(null)
      setMessages([])
      setNotice({ text: 'Saved token deleted.' })
    } catch {
      setNotice({ text: 'Could not delete the saved token.', bad: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={{ backgroundColor: colors.panel, borderRadius: 12, padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Account switcher</Text>
        <Text style={{ color: colors.muted, marginTop: 5, lineHeight: 19 }}>
          Choose which interface to use. Your regular Discord login stays active in Discord; bot mode uses the bot token saved by this plugin.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable
            onPress={() => setAccountMode('user')}
            style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: accountMode === 'user' ? colors.accent : colors.panel2, alignItems: 'center' }}
          >
            <Text style={{ color: colors.text, fontWeight: '700', textAlign: 'center' }}>User account</Text>
          </Pressable>
          <Pressable
            onPress={() => setAccountMode('bot')}
            style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: accountMode === 'bot' ? colors.accent : colors.panel2, alignItems: 'center' }}
          >
            <Text style={{ color: colors.text, fontWeight: '700', textAlign: 'center' }}>Bot account</Text>
          </Pressable>
        </View>
      </View>

      {accountMode === 'user' ? (
        <View style={{ backgroundColor: colors.panel, borderRadius: 12, padding: 16, marginTop: 12 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>Normal Discord account</Text>
          <Text style={{ color: colors.muted, marginTop: 7, lineHeight: 19 }}>
            Your normal user session is unchanged. To use Discord as usual, leave this plugin settings page. Select Bot account here to open the separate bot interface.
          </Text>
          <Button title="Switch to bot account" onPress={() => setAccountMode('bot')} />
        </View>
      ) : (
        <>
          <View style={{ backgroundColor: colors.panel, borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>BOT ACCOUNT MODE</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>This is a separate bot interface, not a replacement for Discord's signed-in user session.</Text>
            <Button title="Switch to user account" onPress={() => setAccountMode('user')} />
          </View>
      <View style={{ backgroundColor: colors.panel, borderRadius: 12, padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Bot Client</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          A Discord-mobile-style bot client prototype
        </Text>

        <Label>Bot token</Label>
        <Field value={token} onChangeText={setToken} placeholder="Paste bot token" secureTextEntry />
        <Button title={busy ? 'Working…' : connected ? 'Reconnect' : 'Login'} onPress={() => connect()} disabled={busy} />

        {user && (
          <View style={{ marginTop: 14, padding: 12, borderRadius: 8, backgroundColor: colors.panel2 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{user.global_name || user.username}</Text>
            <Text style={{ color: colors.muted, marginTop: 3 }}>Bot account · ID {user.id}</Text>
            <Text style={{ color: colors.muted, marginTop: 3, fontSize: 12 }}>Token is encrypted at rest with Android Keystore.</Text>
          </View>
        )}

        {notice && (
          <Text style={{ color: notice.bad ? '#ff777b' : '#70e1a1', marginTop: 12 }}>
            {notice.text}
          </Text>
        )}
      </View>

      {connected && (
        <>
          <View style={{ backgroundColor: colors.panel, borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>Servers</Text>
            <Text style={{ color: colors.muted, marginTop: 5, fontSize: 12 }}>
              Enter a server ID to load its channels. This first version does not yet enumerate the bot’s full server list.
            </Text>
            <Field value={guildId} onChangeText={setGuildId} placeholder="Server ID" keyboardType="numeric" />
            <Button title="Load server" onPress={loadGuild} disabled={busy} />
            {!!guildName && <Text style={{ color: colors.text, marginTop: 12, fontWeight: '700' }}>{guildName}</Text>}
            {channels.map(item => (
              <Pressable
                key={item.id}
                onPress={() => openChannel(item)}
                style={{
                  padding: 11,
                  borderRadius: 7,
                  backgroundColor: channel?.id === item.id ? '#414675' : colors.panel2,
                  marginTop: 6,
                }}
              >
                <Text style={{ color: colors.text }}># {item.name}</Text>
              </Pressable>
            ))}
          </View>

          {channel && (
            <View style={{ backgroundColor: colors.panel, borderRadius: 12, padding: 16, marginTop: 12 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}># {channel.name}</Text>
              {busy && <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />}
              {messages.map(msg => (
                <View key={msg.id} style={{ paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{msg.author?.username || 'Unknown'}</Text>
                  <Text style={{ color: colors.muted, marginTop: 3 }}>{msg.content || '[non-text message]'}</Text>
                </View>
              ))}
              <Field value={draft} onChangeText={setDraft} placeholder="Message this channel…" />
              <Button title="Send message" onPress={sendMessage} disabled={busy || !draft.trim()} />
            </View>
          )}

          <View style={{ backgroundColor: colors.panel, borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>Server nickname</Text>
            <Text style={{ color: colors.muted, marginTop: 5, fontSize: 12 }}>
              Changes the bot’s nickname in the server ID above. Discord permissions still apply.
            </Text>
            <Field value={nickname} onChangeText={setNickname} placeholder="New nickname" />
            <Button title="Change nickname" onPress={saveNickname} disabled={busy} />
          </View>

          <Button title="Log out and delete saved token" onPress={logout} disabled={busy} danger />
        </>
      )}

      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 16, lineHeight: 16 }}>
        Prototype: DMs, full server navigation, gateway live updates, attachments, reactions, voice and normal user-only settings are not implemented. Only use a bot token you own. Never share it.
      </Text>
        </>
      )}
    </ScrollView>
  )
}

export default plugin({
  SettingsComponent: BotClientSettings,
})

declare module '@revenge-mod/modules/native' {
  export interface NativeMethods {
    'dev.jayden.botclient.loadToken': [args: [], returnValue: string]
    'dev.jayden.botclient.saveToken': [args: [token: string], returnValue: null]
    'dev.jayden.botclient.deleteToken': [args: [], returnValue: null]
  }
}
