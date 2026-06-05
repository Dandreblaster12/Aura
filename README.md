# AURA AI Desktop App

Futuristic, voice-activated AI operating system with a J.A.R.V.I.S.-inspired UI.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide React
- **Desktop Shell**: Electron
- **Language**: TypeScript

## Project Structure

- `src/`: React frontend code
  - `components/layout/`: Sidebar, TopBar, and common layout components
  - `App.tsx`: Main entry with routing and layout
- `electron/`: Electron main and preload scripts
- `public/`: Static assets

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run electron:build
```

## Theme Colors

- **J.A.R.V.I.S. Blue**: `#00B4FF`
- **J.A.R.V.I.S. Dark**: `#0088FF`
- **Background**: Glass-morphism with blur and semi-transparent dark panels
