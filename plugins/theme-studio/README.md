# Theme Studio plugin source

This folder is designed to be copied into `plugins/theme-studio/` in the official Revenge plugin template.

- `manifest.json` describes the plugin to Revenge's packaging system.
- `js/index.ts` is the TypeScript entry point bundled to `index.js` by the official template.

Do not install this source folder or the outer source ZIP directly in Revenge. Build it with the official template first so the generated ZIP contains `manifest.json` and the compiled `index.js` at the archive root.
