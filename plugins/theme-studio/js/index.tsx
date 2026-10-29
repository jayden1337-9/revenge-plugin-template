import React from 'react'
import { View, Text, TextInput, Pressable, ImageBackground, ScrollView } from 'react-native'

type ThemePack = {
  id: string
  name: string
  background: string
  surface: string
  text: string
  accent: string
  glass: boolean
  imageUrl: string
}
type Settings = { packs: ThemePack[]; selectedId: string; draft: ThemePack; page?: 'discover' | 'create' }
const DEFAULT_DRAFT: ThemePack = { id: 'custom-1', name: 'My Theme', background: '#202225', surface: '#2f3136', text: '#ffffff', accent: '#5865f2', glass: true, imageUrl: '' }
const PUBLIC_THEMES: ThemePack[] = [
  { id: 'midnight-violet', name: 'Midnight Violet', background: '#171323', surface: '#28213b', text: '#f5efff', accent: '#a78bfa', glass: true, imageUrl: '' },
  { id: 'ocean-glass', name: 'Ocean Glass', background: '#071b2a', surface: '#12374a', text: '#e4f7ff', accent: '#42d9ff', glass: true, imageUrl: '' },
  { id: 'rose-night', name: 'Rose Night', background: '#24151e', surface: '#3a202f', text: '#fff0f6', accent: '#ff6fae', glass: false, imageUrl: '' },
  { id: 'forest', name: 'Forest', background: '#101e18', surface: '#20372b', text: '#e6ffef', accent: '#5ce0a0', glass: false, imageUrl: '' },
]
const hex = (v: string, fallback: string) => /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(v) ? v : fallback
const safeId = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'custom-theme'
const C = { ink: '#f5f2f8', muted: '#aaa4b3', panel: '#211d26', panel2: '#2b2531', line: '#3a3341', accent: '#c5a5ff', danger: '#ff647c' }
const labelStyle = { color: C.muted, fontSize: 12, fontWeight: '700' as const, marginBottom: 7 }
const inputStyle = { color: C.ink, backgroundColor: '#17141b', borderColor: C.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14 }
function Action({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable onPress={onPress} style={{ backgroundColor: secondary ? C.panel2 : C.accent, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 11, alignItems: 'center' }}><Text style={{ color: secondary ? C.ink : '#21152f', fontWeight: '800' }}>{title}</Text></Pressable>
}
function Field({ title, value, onChange, placeholder }: { title: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <View style={{ marginBottom: 14 }}><Text style={labelStyle}>{title.toUpperCase()}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder || ''} placeholderTextColor="#746d7d" autoCapitalize="none" style={inputStyle} /></View>
}
function Preview({ pack }: { pack: ThemePack }) {
  const card = <View style={{ margin: 14, padding: 16, borderRadius: 18, backgroundColor: pack.glass ? '#17141bc9' : hex(pack.surface, '#2f3136'), borderWidth: 1, borderColor: pack.glass ? '#ffffff30' : '#ffffff10' }}>
    <Text style={{ color: hex(pack.text, '#ffffff'), fontSize: 17, fontWeight: '800', marginBottom: 5 }}>{pack.name || 'Your theme'}</Text>
    <Text style={{ color: hex(pack.text, '#ffffff'), opacity: 0.72, fontSize: 12, marginBottom: 15 }}>A little preview of your Revenge look</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: hex(pack.accent, '#5865f2'), alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900' }}>R</Text></View><View style={{ flex: 1 }}><Text style={{ color: hex(pack.text, '#ffffff'), fontWeight: '700' }}>Theme preview</Text><Text style={{ color: hex(pack.text, '#ffffff'), opacity: 0.65, fontSize: 11 }}>Colours update as you edit</Text></View><View style={{ backgroundColor: hex(pack.accent, '#5865f2'), borderRadius: 8, paddingVertical: 7, paddingHorizontal: 11 }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>BUTTON</Text></View></View>
  </View>
  return pack.imageUrl.trim() ? <ImageBackground source={{ uri: pack.imageUrl.trim() }} resizeMode="cover" imageStyle={{ borderRadius: 18 }} style={{ borderRadius: 18, overflow: 'hidden', minHeight: 170, justifyContent: 'center', backgroundColor: hex(pack.background, '#202225') }}>{card}</ImageBackground> : <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: hex(pack.background, '#202225'), minHeight: 170, justifyContent: 'center' }}>{card}</View>
}
export default plugin<{ jsonStorage: Settings }>({
  jsonStorage: { load: true, default: { packs: [], selectedId: '', draft: DEFAULT_DRAFT, page: 'discover' } },
  preInit({ themes }) { themes.registerGroup('theme-studio-local', { name: 'Theme Studio', description: 'Themes created or saved locally on this device.' }) },
  start({ themes, jsonStorage, logger }) {
    const registerPack = (p: ThemePack) => themes.registerTheme('theme-studio-local', safeId(p.id || p.name), {
      name: p.name.trim().slice(0, 40) || 'Untitled Theme',
      getColors: () => {
        const bg = hex(p.background, '#202225'), surface = hex(p.surface, '#2f3136'), fg = hex(p.text, '#ffffff')
        return { semantic: {
          dark: { BACKGROUND_BASE_LOWEST: bg, BACKGROUND_BASE: bg, BACKGROUND_BASE_HIGH: surface, BACKGROUND_BASE_LOWER: surface, TEXT_DEFAULT: fg },
          darker: { BACKGROUND_BASE_LOWEST: bg, BACKGROUND_BASE: bg, BACKGROUND_BASE_HIGH: surface, BACKGROUND_BASE_LOWER: surface, TEXT_DEFAULT: fg },
          light: { BACKGROUND_BASE_LOWEST: bg, BACKGROUND_BASE: bg, BACKGROUND_BASE_HIGH: surface, BACKGROUND_BASE_LOWER: surface, TEXT_DEFAULT: fg },
          midnight: { BACKGROUND_BASE_LOWEST: bg, BACKGROUND_BASE: bg, BACKGROUND_BASE_HIGH: surface, BACKGROUND_BASE_LOWER: surface, TEXT_DEFAULT: fg },
        }, raw: { BRAND_500: hex(p.accent, '#5865f2') } }
      },
    })
    for (const p of jsonStorage.cache?.packs ?? []) { try { registerPack(p) } catch (e) { logger.error('Could not register saved theme', e) } }
    logger.log('Theme Studio loaded')
  },
  SettingsComponent({ api }) {
    const settings = api.jsonStorage.use()
    const packs = settings?.packs ?? []
    const draft = settings?.draft ?? DEFAULT_DRAFT
    const page = settings?.page ?? 'discover'
    const update = (patch: Partial<ThemePack>) => api.jsonStorage.set({ ...settings, draft: { ...draft, ...patch } })
    const openCreate = (pack = DEFAULT_DRAFT) => api.jsonStorage.set({ ...settings, page: 'create', draft: { ...pack } })
    const save = (source = draft) => {
      const name = source.name.trim().slice(0, 40) || 'Untitled Theme'
      const id = safeId(name)
      const pack = { ...source, id, name, background: hex(source.background, '#202225'), surface: hex(source.surface, '#2f3136'), text: hex(source.text, '#ffffff'), accent: hex(source.accent, '#5865f2'), imageUrl: source.imageUrl.trim() }
      const next = [...packs.filter(p => p.id !== id), pack]
      api.jsonStorage.set({ ...settings, packs: next, selectedId: id, draft: pack, page: 'discover' })
      try { api.themes.registerTheme('theme-studio-local', id, { name, getColors: () => ({ semantic: {
        dark: { BACKGROUND_BASE_LOWEST: pack.background, BACKGROUND_BASE: pack.background, BACKGROUND_BASE_HIGH: pack.surface, BACKGROUND_BASE_LOWER: pack.surface, TEXT_DEFAULT: pack.text },
        darker: { BACKGROUND_BASE_LOWEST: pack.background, BACKGROUND_BASE: pack.background, BACKGROUND_BASE_HIGH: pack.surface, BACKGROUND_BASE_LOWER: pack.surface, TEXT_DEFAULT: pack.text },
        light: { BACKGROUND_BASE_LOWEST: pack.background, BACKGROUND_BASE: pack.background, BACKGROUND_BASE_HIGH: pack.surface, BACKGROUND_BASE_LOWER: pack.surface, TEXT_DEFAULT: pack.text },
        midnight: { BACKGROUND_BASE_LOWEST: pack.background, BACKGROUND_BASE: pack.background, BACKGROUND_BASE_HIGH: pack.surface, BACKGROUND_BASE_LOWER: pack.surface, TEXT_DEFAULT: pack.text },
      }, raw: { BRAND_500: pack.accent } }) }) } catch (e) { /* Theme remains saved and can register after restart. */ }
    }
    const remove = (id: string) => api.jsonStorage.set({ ...settings, packs: packs.filter(p => p.id !== id), selectedId: settings?.selectedId === id ? '' : settings?.selectedId })
    const installPublic = (p: ThemePack) => save({ ...p })
    const section = (title: string, subtitle: string, children: React.ReactNode) => <View style={{ backgroundColor: C.panel, borderRadius: 18, padding: 15, marginBottom: 14, borderWidth: 1, borderColor: '#ffffff0d' }}><Text style={{ color: C.ink, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>{title}</Text><Text style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>{subtitle}</Text>{children}</View>
    return <ScrollView style={{ flex: 1, backgroundColor: '#151219' }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={{ marginBottom: 18 }}><Text style={{ color: C.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.6 }}>Theme Studio</Text><Text style={{ color: C.muted, marginTop: 5, fontSize: 13 }}>Find a look. Make it yours.</Text></View>
      <View style={{ flexDirection: 'row', backgroundColor: C.panel, padding: 4, borderRadius: 14, gap: 5, marginBottom: 18 }}>
        <View style={{ flex: 1 }}><Action title="Discover themes" secondary={page !== 'discover'} onPress={() => api.jsonStorage.set({ ...settings, page: 'discover' })} /></View>
        <View style={{ flex: 1 }}><Action title="Create theme" secondary={page !== 'create'} onPress={() => openCreate(draft)} /></View>
      </View>
      {page === 'discover' ? <>
        {section('Community picks', 'Browse starter themes. Saving adds them to your local Revenge theme list.', <View style={{ gap: 12 }}>{PUBLIC_THEMES.map(p => <View key={p.id} style={{ backgroundColor: C.panel2, borderRadius: 15, padding: 12, borderWidth: 1, borderColor: C.line }}><Preview pack={p} /><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, gap: 8 }}><View style={{ flex: 1 }}><Text style={{ color: C.ink, fontWeight: '800', fontSize: 14 }}>{p.name}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{p.glass ? 'Glass style' : 'Solid style'} · curated starter</Text></View><Action title="Save theme" onPress={() => installPublic(p)} /></View></View>)}</View>)}
        {section('Your library', 'Themes saved on this device.', packs.length ? <View style={{ gap: 10 }}>{packs.map(p => <View key={p.id} style={{ padding: 12, backgroundColor: C.panel2, borderRadius: 14 }}><Preview pack={p} /><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}><Text style={{ color: C.ink, fontWeight: '800', flex: 1 }}>{p.name}</Text><View style={{ flexDirection: 'row', gap: 7 }}><Action title="Edit" secondary onPress={() => openCreate(p)} /><Action title="Delete" secondary onPress={() => remove(p.id)} /></View></View></View>)}</View> : <Text style={{ color: C.muted, fontSize: 13 }}>Nothing saved yet. Pick a community theme or create your own.</Text>)}
      </> : <>
        {section('Create your theme', 'Build the look with a live preview as you go.', <><Field title="Theme name" value={draft.name} onChange={name => update({ name })} placeholder="Midnight glass" /><Text style={{ color: C.ink, fontWeight: '800', fontSize: 14, marginBottom: 10 }}>Live preview</Text><Preview pack={draft} /><View style={{ height: 15 }} /><Field title="Background colour (hex)" value={draft.background} onChange={background => update({ background })} placeholder="#202225" /><Field title="Surface colour (hex)" value={draft.surface} onChange={surface => update({ surface })} placeholder="#2f3136" /><Field title="Text colour (hex)" value={draft.text} onChange={text => update({ text })} placeholder="#ffffff" /><Field title="Accent colour (hex)" value={draft.accent} onChange={accent => update({ accent })} placeholder="#5865f2" /><Field title="Background image URL (optional)" value={draft.imageUrl} onChange={imageUrl => update({ imageUrl })} placeholder="https://example.com/image.jpg" /><Pressable onPress={() => update({ glass: !draft.glass })} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderRadius: 12, backgroundColor: C.panel2, marginBottom: 14 }}><View style={{ flex: 1, paddingRight: 12 }}><Text style={{ color: C.ink, fontWeight: '800' }}>Glassy appearance</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>Preview translucent panels with a subtle border.</Text></View><View style={{ width: 46, height: 28, borderRadius: 20, padding: 3, backgroundColor: draft.glass ? C.accent : '#514958', justifyContent: 'center', alignItems: draft.glass ? 'flex-end' : 'flex-start' }}><View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' }} /></View></Pressable><Action title="Save to my themes" onPress={() => save()} /></>)}
        {section('My saved themes', 'Tap edit to continue working on an existing theme.', packs.length ? <View style={{ gap: 8 }}>{packs.map(p => <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, gap: 8 }}><Text style={{ color: C.ink, flex: 1 }}>{p.name}</Text><Action title="Edit" secondary onPress={() => openCreate(p)} /></View>)}</View> : <Text style={{ color: C.muted }}>Your saved themes will show here.</Text>)}
      </>}
      <Text style={{ color: '#77707f', fontSize: 11, lineHeight: 16, marginTop: 3 }}>Note: the image and glass effect are shown in Theme Studio's preview. Revenge's standard theme colour API only applies colours; making image backgrounds and real blur affect the entire Discord UI needs additional styling support.</Text>
    </ScrollView>
  },
})
