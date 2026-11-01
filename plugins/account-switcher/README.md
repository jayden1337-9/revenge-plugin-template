# Revenge Account Switcher

**Version 0.1.0 — persistent profile manager preview.**

## Included
- Settings UI with saved profile cards
- Add profiles using username and numeric Discord user ID
- Optional HTTPS avatar URL
- Persistent non-secret profile metadata using Revenge per-plugin JSON storage
- Explicit profile removal and sorted list

## Session switching status
Actual Discord login/session switching is **not implemented**. The public Revenge plugin API available to this project does not expose a documented account-session switching interface. The UI therefore marks switching unavailable instead of pretending it succeeded.

The plugin never reads, extracts, exports, or stores Discord tokens, cookies, passwords, or other authentication secrets. Discord remains responsible for authentication. Removing a profile only removes local metadata; it does not log out of Discord.

## Build
Run the **Account Switcher Build** workflow manually, or push changes under `plugins/account-switcher/`.
