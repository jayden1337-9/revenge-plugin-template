import React from 'react'
import { Alert, Linking, Pressable, Text, View } from 'react-native'

const C = { bg: '#171311', panel: '#2a211d', ink: '#fff1e8', muted: '#c4aaa0', accent: '#e36b32', line: '#51372c' }
const ENGINE_URL = 'https://js-dos.com/'

function Button({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable onPress={onPress} style={{ backgroundColor: secondary ? C.panel : C.accent, borderColor: C.line, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' }}>
    <Text style={{ color: C.ink, fontWeight: '800' }}>{title}</Text>
  </Pressable>
}

export default plugin({
  start() {
    console.log('[Doom Launcher] ready')
  },
  stop() {
    console.log('[Doom Launcher] stopped')
  },
  SettingsComponent() {
    const openEngine = async () => {
      try {
        await Linking.openURL(ENGINE_URL)
      } catch (error) {
        Alert.alert('Could not open engine', 'Check that a browser is installed and try again.')
      }
    }
    return <View style={{ flex: 1, backgroundColor: C.bg, padding: 16, gap: 14 }}>
      <View style={{ backgroundColor: C.panel, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 18, gap: 8 }}>
        <Text style={{ color: C.accent, fontSize: 12, fontWeight: '900', letterSpacing: 2 }}>CLASSIC FPS</Text>
        <Text style={{ color: C.ink, fontSize: 26, fontWeight: '900' }}>DOOM Launcher</Text>
        <Text style={{ color: C.muted, lineHeight: 20 }}>Launch a browser-based DOS/JS engine, then load a WAD file that you have the right to use. The plugin does not include game data.</Text>
      </View>
      <Button title="OPEN JS-DOS IN BROWSER" onPress={openEngine} />
      <View style={{ backgroundColor: C.panel, borderRadius: 12, padding: 14, gap: 7 }}>
        <Text style={{ color: C.ink, fontWeight: '800' }}>How to use your WAD</Text>
        <Text style={{ color: C.muted, lineHeight: 20 }}>1. Open the engine in your browser.{"\n"}2. Choose a compatible DOOM setup or upload flow supported by that site.{"\n"}3. Select your own IWAD/PWAD when prompted.</Text>
      </View>
      <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16 }}>Note: this first version is an external-browser launcher, not an embedded DOOM runtime. Discord's plugin sandbox does not provide a bundled native engine or guaranteed WebView/file-picker access.</Text>
    </View>
  },
})
