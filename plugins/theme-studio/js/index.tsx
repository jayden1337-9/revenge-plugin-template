import React from 'react'
import { View } from 'react-native'
import { Design } from '@revenge-mod/discord/design'

type ThemePack = {
  id: string
  name: string
  background: string
  surface: string
  text: string
  accent: string
}

type Settings = {
  packs: ThemePack[]
  selectedId: string
  draft: ThemePack
}

const DEFAULT_DRAFT: ThemePack = {
  id: 'custom-1',
  name: 'My Theme',
  background: '#202225',
  surface: '#2f3136',
  text: '#ffffff',
  accent: '#5865f2',
}

const hex = (value: string, fallback: string) => /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value) ? value : fallback
const safeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'custom-theme'

export default plugin<{ jsonStorage: Settings }>({
  jsonStorage: {
    load: true,
    default: { packs: [], selectedId: '', draft: DEFAULT_DRAFT },
  },

  preInit({ themes }) {
    themes.registerGroup('theme-studio-local', {
      name: 'Theme Studio',
      description: 'Themes created locally on this device.',
    })
  },

  start({ themes, jsonStorage, logger }) {
    const registerPack = (pack: ThemePack) => {
      const id = safeId(pack.id || pack.name)
      themes.registerTheme('theme-studio-local', id, {
        name: pack.name.trim().slice(0, 40) || 'Untitled Theme',
        getColors: () => ({
          semantic: {
            dark: {
              BACKGROUND_BASE_LOWEST: hex(pack.background, '#202225'),
              BACKGROUND_BASE: hex(pack.background, '#202225'),
              BACKGROUND_BASE_HIGH: hex(pack.surface, '#2f3136'),
              BACKGROUND_BASE_LOWER: hex(pack.surface, '#2f3136'),
              TEXT_DEFAULT: hex(pack.text, '#ffffff'),
            },
            darker: {
              BACKGROUND_BASE_LOWEST: hex(pack.background, '#202225'),
              BACKGROUND_BASE: hex(pack.background, '#202225'),
              BACKGROUND_BASE_HIGH: hex(pack.surface, '#2f3136'),
              BACKGROUND_BASE_LOWER: hex(pack.surface, '#2f3136'),
              TEXT_DEFAULT: hex(pack.text, '#ffffff'),
            },
            light: {
              BACKGROUND_BASE_LOWEST: hex(pack.background, '#f2f3f5'),
              BACKGROUND_BASE: hex(pack.background, '#f2f3f5'),
              BACKGROUND_BASE_HIGH: hex(pack.surface, '#ffffff'),
              BACKGROUND_BASE_LOWER: hex(pack.surface, '#ffffff'),
              TEXT_DEFAULT: hex(pack.text, '#232428'),
            },
            midnight: {
              BACKGROUND_BASE_LOWEST: hex(pack.background, '#111214'),
              BACKGROUND_BASE: hex(pack.background, '#111214'),
              BACKGROUND_BASE_HIGH: hex(pack.surface, '#1e1f22'),
              BACKGROUND_BASE_LOWER: hex(pack.surface, '#1e1f22'),
              TEXT_DEFAULT: hex(pack.text, '#ffffff'),
            },
          },
          raw: { BRAND_500: hex(pack.accent, '#5865f2') },
        }),
      })
    }

    for (const pack of jsonStorage.cache?.packs ?? []) registerPack(pack)
    logger.log('Theme Studio loaded local themes')
  },

  SettingsComponent({ api }) {
    const { TableRowGroup, TableRow, TableSwitchRow } = Design
    const settings = api.jsonStorage.use()
    const packs = settings?.packs ?? []
    const draft = settings?.draft ?? DEFAULT_DRAFT
    const update = (patch: Partial<ThemePack>) => api.jsonStorage.set({
      ...settings,
      draft: { ...draft, ...patch },
    })
    const save = () => {
      const name = draft.name.trim().slice(0, 40) || 'Untitled Theme'
      const id = safeId(name)
      const pack = {
        ...draft,
        id,
        name,
        background: hex(draft.background, '#202225'),
        surface: hex(draft.surface, '#2f3136'),
        text: hex(draft.text, '#ffffff'),
        accent: hex(draft.accent, '#5865f2'),
      }
      const next = [...packs.filter(p => p.id !== id), pack]
      api.jsonStorage.set({ ...settings, packs: next, selectedId: id, draft: pack })
      try {
        api.themes.registerTheme('theme-studio-local', id, {
          name,
          getColors: () => ({
            semantic: {
              dark: { BACKGROUND_BASE_LOWEST: pack.background, BACKGROUND_BASE: pack.background, BACKGROUND_BASE_HIGH: pack.surface, BACKGROUND_BASE_LOWER: pack.surface, TEXT_DEFAULT: pack.text },
              darker: { BACKGROUND_BASE_LOWEST: pack.background, BACKGROUND_BASE: pack.background, BACKGROUND_BASE_HIGH: pack.surface, BACKGROUND_BASE_LOWER: pack.surface, TEXT_DEFAULT: pack.text },
              light: { BACKGROUND_BASE_LOWEST: pack.background, BACKGROUND_BASE: pack.background, BACKGROUND_BASE_HIGH: pack.surface, BACKGROUND_BASE_LOWER: pack.surface, TEXT_DEFAULT: pack.text },
              midnight: { BACKGROUND_BASE_LOWEST: pack.background, BACKGROUND_BASE: pack.background, BACKGROUND_BASE_HIGH: pack.surface, BACKGROUND_BASE_LOWER: pack.surface, TEXT_DEFAULT: pack.text },
            }, raw: { BRAND_500: pack.accent },
          }),
        })
      } catch (e) { /* Theme appears after next reload if the host disallows live registration. */ }
    }
    const remove = (id: string) => api.jsonStorage.set({ ...settings, packs: packs.filter(p => p.id !== id), selectedId: settings?.selectedId === id ? '' : settings?.selectedId })
    const load = (pack: ThemePack) => api.jsonStorage.set({ ...settings, draft: { ...pack } })

    return (
      <>
        <TableRowGroup title="Theme Creator" subtitle="Create color themes that match Revenge's native settings style.">
          <TableRow label="Theme name" description="Use a short name for the Revenge Themes picker." />
          <TableRow label="Name" trailing={<Design.TextInput value={draft.name} onChange={(name: string) => update({ name })} placeholder="My Theme" />} />
          <TableRow label="Background" trailing={<Design.TextInput value={draft.background} onChange={(background: string) => update({ background })} placeholder="#202225" />} />
          <TableRow label="Surface" trailing={<Design.TextInput value={draft.surface} onChange={(surface: string) => update({ surface })} placeholder="#2f3136" />} />
          <TableRow label="Text" trailing={<Design.TextInput value={draft.text} onChange={(text: string) => update({ text })} placeholder="#ffffff" />} />
          <TableRow label="Accent" trailing={<Design.TextInput value={draft.accent} onChange={(accent: string) => update({ accent })} placeholder="#5865f2" />} />
          <TableRow label="Preview" description={`${draft.background} background · ${draft.surface} surface · ${draft.accent} accent`} trailing={<View style={{ flexDirection: 'row', gap: 5 }}><View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: draft.background }} /><View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: draft.surface }} /><View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: draft.accent }} /></View>} />
          <TableRow label="Save theme" description="Saves this theme locally and registers it in Revenge's Themes picker." trailing={<Design.Button text="Save" onPress={save} />} />
        </TableRowGroup>
        <TableRowGroup title={`Local Theme Hub (${packs.length})`} subtitle="Only themes saved on this device appear here. No marketplace or account is used.">
          {packs.length === 0 ? <TableRow label="No saved themes yet" description="Create a theme above, then save it." /> : packs.map(pack => (
            <TableRow key={pack.id} label={pack.name} description={`${pack.background} · ${pack.accent}`} trailing={<View style={{ flexDirection: 'row', gap: 6 }}><Design.Button text="Edit" onPress={() => load(pack)} /><Design.Button text="Delete" variant="destructive" onPress={() => remove(pack.id)} /></View>} />
          ))}
        </TableRowGroup>
        <TableRowGroup title="How to apply">
          <TableRow label="Open Settings → Revenge → Themes → Colors" description="Choose a theme in the Theme Studio group. Some color changes may need the Themes screen's Reload action." />
          <TableRow label="Pack sharing and Discord review" description="Not included in this local-only first version. A secure approval flow needs a separate server or bot; a webhook alone cannot securely handle Approve/Deny button interactions." />
        </TableRowGroup>
      </>
    )
  },
})
