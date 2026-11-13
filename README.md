# CloudTerminal

A browser-based terminal in the CyberStudios™ pastel cyberspace. It runs simulated commands, displays animated ASCII skies, and uses palettes made in PalettePilot.

## Windows desktop app

Extract the full Windows x64 package, then open `CloudTerminal.exe` inside it. Keep the executable and its supporting files in the same folder. The app runs offline and stores its settings locally.

To build the Windows package from source, run:

```sh
npm ci
npm run package:win
```

The executable and its supporting files are written to `dist-desktop/CloudTerminal-win32-x64/`. Use `npm run build` followed by `npm run desktop` to run Electron from source.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Type `help` for the full command list. Use ↑ and ↓ to navigate history, Tab to complete a command, and Enter to run it. When Tab has no completion to offer, it moves focus normally. The sky follows your system's reduced-motion preference and has a separate Reduce motion control.

## Themes

- Run `theme list` to find built-in themes, then `theme preview rose-orbit` or `theme apply rose-orbit`.
- In PalettePilot, download **CyberStudios JSON**. In CloudTerminal, select **Import palette** or run `import`. Preview the theme, then apply it or cancel.
- The applied theme, sky, and motion setting are saved in the browser. Command history lasts for the session. The terminal has no system shell or remote execution.

See the [palette format](docs/palette-v1.md) and [sample theme](src/themes/default.json).

## Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

To run the cross-app test, serve PalettePilot's production build on port 4174. Set `PALETTEPILOT_URL=http://127.0.0.1:4174` and run `npm run test:browser -- interop` from CloudTerminal. The default browser suite runs independently.

For the Windows integration test, set `CLOUDTERMINAL_EXE` and `PALETTEPILOT_EXE` to the full paths of the built executables, then run `npm run test:browser -- desktop`.

The production output in `dist/` uses relative asset URLs and can be served from a static site or a subdirectory. The GitHub workflow runs checks only.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [LICENSE](LICENSE).
