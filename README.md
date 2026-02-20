# meow

**Focus mode. Made delightful.**

A desktop productivity app with a Pomodoro timer, ambient sounds, and cute animal companions to keep you company while you work.

## Apps

| App | Description |
|-----|-------------|
| `apps/desktop` | Tauri (Rust) + Next.js desktop app |
| `apps/landing` | Next.js marketing/landing page |

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

- **Tauri (Rust)** — Desktop shell
- **Next.js** — UI framework (static export for desktop, app router for landing)
- **Tailwind CSS v4** — Styling
- **Framer Motion** — Animations
- **Howler.js** — Audio playback

## Getting Started

### Prerequisites

- Node.js 18+
- Rust (latest stable via [rustup](https://rustup.rs))
- npm

### Install

```bash
npm install
```

### Development

Run the desktop app with hot reload:

```bash
npm run dev:desktop
```

Run the landing page:

```bash
npm run dev:landing
```

### Production

Build the desktop app:

```bash
npm run build:desktop
```

Build the landing page:

```bash
npm run build:landing
```

The desktop build produces a distributable `.dmg` (macOS) or `.exe` (Windows) in `apps/desktop/src-tauri/target/release/bundle/`.

## Project Structure

```
meow/
├── apps/
│   ├── desktop/                   # Tauri + Next.js desktop app
│   │   ├── src-tauri/             # Rust backend (Tauri)
│   │   │   ├── src/
│   │   │   │   ├── main.rs        # Tauri app entry point
│   │   │   │   ├── lib.rs         # App setup and plugin registration
│   │   │   │   ├── windows.rs     # Window management and popover logic
│   │   │   │   ├── tray.rs        # System tray setup
│   │   │   │   ├── commands.rs    # Tauri commands (IPC handlers)
│   │   │   │   ├── mouse_tracker.rs # Cursor tracking for auto-collapse
│   │   │   │   └── platform/      # macOS-specific APIs
│   │   │   └── tauri.conf.json    # Tauri configuration
│   │   ├── renderer/              # Next.js app (UI)
│   │   │   ├── app/
│   │   │   │   ├── layout.js      # Root layout
│   │   │   │   ├── page.js        # Main app page
│   │   │   │   └── globals.css    # Tailwind + custom animations
│   │   │   └── components/
│   │   │       ├── Timer.jsx      # Circular progress timer
│   │   │       ├── Controls.jsx   # Play/Pause/Reset/Skip buttons
│   │   │       ├── AmbientSounds.jsx  # Sound mixer panel
│   │   │       ├── FocusPal.jsx   # Animated animal companions
│   │   │       ├── Settings.jsx   # Settings panel
│   │   │       └── TitleBar.jsx   # Custom window title bar
│   │   └── package.json
│   └── landing/                   # Next.js marketing site
│       ├── app/
│       │   ├── layout.js
│       │   ├── page.js
│       │   └── globals.css
│       ├── public/
│       └── package.json
├── scripts/
│   └── generate-sounds.js         # Script to regenerate sound files
└── package.json                   # Root workspace config
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+F` | Show/Hide window |
| Click tray icon | Toggle window |

## License

MIT
