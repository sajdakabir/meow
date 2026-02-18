# Zen Focus

**Focus mode. Made delightful.**

A desktop productivity app with a Pomodoro timer, ambient sounds, and cute animal companions to keep you company while you work.

## Features

- **Pomodoro Timer** — 25/5/15 minute cycles with visual progress ring and auto-cycling between focus and break sessions
- **Ambient Sounds** — 8 mixable soundscapes (Rain, Forest, Ocean, Fireplace, Cafe, Wind, Birds, Thunder) with individual volume controls
- **Focus Pals** — 6 animated animal companions (Cat, Fox, Owl, Panda, Bear, Bunny) that react to your timer state
- **System Tray** — Lives in your menu bar with quick controls
- **Always on Top** — Stays visible while you work
- **Desktop Notifications** — Alerts when sessions complete
- **Keyboard Shortcut** — `Cmd+Shift+F` to toggle the window
- **Customizable** — Adjust timer durations, toggle companion/timer visibility, auto-start behavior

## Tech Stack

- **Electron** — Desktop shell
- **Next.js** — UI framework (static export)
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Howler.js** — Audio playback

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

Run with hot reload (Next.js dev server + Electron):

```bash
npm run dev
```

### Production

Build the static site and launch Electron:

```bash
npm run next-build
npm run start
```

### Package for Distribution

```bash
npm run build
```

This creates a distributable `.dmg` (macOS) or `.exe` (Windows) in the `dist/` folder.

## Project Structure

```
zen-focus/
├── main/                      # Electron main process
│   ├── main.js                # Window, tray, IPC, custom protocol
│   └── preload.js             # Context bridge for renderer
├── renderer/                  # Next.js app (UI)
│   ├── app/
│   │   ├── layout.js          # Root layout
│   │   ├── page.js            # Main app page
│   │   └── globals.css        # Tailwind + custom animations
│   ├── components/
│   │   ├── Timer.jsx          # Circular progress timer
│   │   ├── Controls.jsx       # Play/Pause/Reset/Skip buttons
│   │   ├── AmbientSounds.jsx  # Sound mixer panel
│   │   ├── FocusPal.jsx       # Animated animal companions
│   │   ├── Settings.jsx       # Settings panel
│   │   └── TitleBar.jsx       # Custom window title bar
│   ├── hooks/
│   │   ├── useTimer.js        # Pomodoro timer logic
│   │   └── useAudio.js        # Audio playback management
│   └── public/
│       ├── sounds/            # Ambient sound files (.wav)
│       └── tray-icon.png      # Menu bar icon
├── scripts/
│   └── generate-sounds.js     # Script to regenerate sound files
└── package.json
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+F` | Show/Hide window |
| Click tray icon | Toggle window |

## License

MIT
