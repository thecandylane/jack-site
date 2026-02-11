# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server at localhost:3000
- `npm run build` — Production build (use to verify changes compile)
- `npm start` — Serve production build

No test runner, linter, or formatter is configured.

## Architecture

Next.js 15 App Router with React 19, plain JavaScript (no TypeScript). Deployed on Vercel.

**Single-page portfolio site** positioned as "Baton Rouge's complete technology resource" — all content lives in `src/app/page.js` as one monolithic component file with nested function components. There is no multi-page routing; navigation is anchor-based scroll between sections.

**Sections:** Hero (6 domain labels), Narrative (3-stage career arc), Services (5 cards), Projects (6 cards), Expertise (7 skill categories), Contact.

### Source layout

- `src/app/page.js` — Entire site: section components, custom hooks, data constants
- `src/app/layout.js` — Root layout with metadata
- `src/app/globals.css` — Global styles, Google Fonts imports (Playfair Display, JetBrains Mono, DM Sans), keyframe animations
- `public/` — Static assets

### Key patterns

- **Styling**: Inline React style objects throughout. No CSS modules, Tailwind, or styled-components. Uses `clamp()` for responsive typography and CSS Grid with `auto-fit` for responsive layouts.
- **Animations**: Custom `useScrollReveal()` hook using Intersection Observer for scroll-triggered reveals. `RevealSection` wrapper component applies staggered fade-in effects.
- **Interactivity**: `useState`/`useEffect` hooks for hover states and scroll detection. No global state management.
- **Color palette**: Dark theme — background `#0a0a0a`, primary text `#e8e8e8`, accent gold `#c89b50`.

### Path alias

`@/*` maps to `./src/*` (configured in jsconfig.json).
