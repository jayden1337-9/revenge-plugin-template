# Revenge Account Switcher

**Status: experimental foundation — not yet a working session switcher.**

## Planned features

- Website-style account menu and compact mobile popup
- Account cards with username, avatar and active-account indicator
- Add/remove profile entries
- Explicit logout/removal only
- Switch confirmation and rollback if the host rejects a switch
- Persistent, non-secret profile metadata

## Authentication boundary

This plugin does not collect, display, export, or save Discord tokens, cookies, passwords, or other authentication secrets. It does not attempt to clone Discord's private account database or call undocumented authentication endpoints.

The template's documented public plugin examples expose lifecycle hooks and native-method bridging, but do not document an official account-session switching API. A UI-only implementation cannot genuinely switch Discord accounts. Session switching must remain disabled until a supported host API is identified and tested.

## Persistence design

Only non-secret profile metadata should be persisted by the plugin. Session credentials must remain under Discord/Android's own authentication management. A profile must never be presented as switchable merely because its metadata exists.

## Build

This is a JavaScript-only plugin and follows the repository's normal packageAllPlugins and release workflow.
