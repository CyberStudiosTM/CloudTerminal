<div align="center">

# ☁️ CloudTerminal

**A little terminal that lives in the clouds.**

*Simulated commands, animated ASCII skies, and palettes you make yourself.*

**A CyberStudios™ creative tool**

![Version](https://img.shields.io/badge/Version-0.1.0-C6B6F3?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-24-AED8F5?style=for-the-badge&logo=nodedotjs&logoColor=202842)
![License](https://img.shields.io/badge/License-MIT-A8E8DC?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Browser%20%C2%B7%20Windows%20x64-F4C8EA?style=for-the-badge)

[Getting Started](#-getting-started) · [Themes](#-themes--palettes) · [Desktop App](#-windows-desktop-app) · [Verify](#-verify) · [Contributing](CONTRIBUTING.md)

</div>

---

## ✦ Welcome to CloudTerminal

Somewhere above the desktop, there's a terminal floating in a pastel sky.

**CloudTerminal** is a browser-based terminal set in the CyberStudios™ pastel cyberspace. It runs simulated commands, paints animated ASCII skies behind your prompt, and wears palettes made in **PalettePilot**.

No system shell. No remote execution. Nothing touching your files.

**Just you, a blinking cursor, and a sky that changes with your mood.**

### What can it do?

| | Feature | Description |
| :---: | :--- | :--- |
| ⌨️ | **Simulated commands** | Type `help` for the full list. Safe to explore. |
| 🌤️ | **Animated ASCII skies** | Living skies behind the terminal, with a separate **Reduce motion** control. |
| 🎨 | **Themes** | Built-in themes, plus palettes imported from PalettePilot. |
| 🕘 | **History & completion** | ↑ / ↓ for history, Tab to complete, Enter to run. |
| 🖥️ | **Desktop app** | An offline Windows x64 app that keeps its settings locally. |

---

## 🌱 Getting Started

**Requirements:** Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Type `help` for the full command list.

- **↑ / ↓** move through your history
- **Tab** completes a command. When there's nothing to complete, it moves focus normally.
- **Enter** runs it

> **Note:** The sky follows your system's reduced-motion preference, and also has its own **Reduce motion** control.

---

## 🎨 Themes & Palettes

**Built-in themes**

```text
theme list
theme preview rose-orbit
theme apply rose-orbit
```

**Bring a palette from PalettePilot**

1. In PalettePilot, download **CyberStudios JSON**.
2. In CloudTerminal, select **Import palette** or run `import`.
3. Preview the theme, then apply it or cancel.

Your applied theme, sky, and motion setting are saved in the browser. Command history lasts for the session.

See the [palette format](docs/palette-v1.md) and the [sample theme](src/themes/default.json).

---

## 🖥️ Windows Desktop App

Extract the full Windows x64 package, then open **`CloudTerminal.exe`** inside it.

Keep the executable and its supporting files in the same folder. The app runs offline and stores its settings locally.

**Build the Windows package from source:**

```sh
npm ci
npm run package:win
```

The executable and its supporting files are written to `dist-desktop/CloudTerminal-win32-x64/`.

To run Electron from source, use `npm run build` followed by `npm run desktop`.

---

## 🔎 Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

**Cross-app test with PalettePilot**

Serve PalettePilot's production build on port 4174, set `PALETTEPILOT_URL=http://127.0.0.1:4174`, then run `npm run test:browser -- interop` from CloudTerminal. The default browser suite runs on its own.

**Windows integration test**

Set `CLOUDTERMINAL_EXE` and `PALETTEPILOT_EXE` to the full paths of the built executables, then run `npm run test:browser -- desktop`.

> **Note:** The production output in `dist/` uses relative asset URLs, so it can be served from a static site or a subdirectory. The GitHub workflow runs checks only.

---

## 🔐 Safety & Privacy

- Commands are **simulated**. There's no system shell and no remote execution.
- Settings stay in your browser or on your PC.
- The desktop app runs offline.

---

<div align="center">

### ✿ Made in Cyberspace

CloudTerminal is part of **CyberStudios™**, a creative software ecosystem of developer tools, digital art, and little interactive worlds.

Its palette partner is **[PalettePilot](https://github.com/CyberStudiosTM/PalettePilot)** ♡

[Repository](https://github.com/CyberStudiosTM/CloudTerminal) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [CyberStudios](https://github.com/CyberStudiosTM)

Licensed under the [MIT License](LICENSE).

*dream in pixels. create without limits.* ☁️

</div>
