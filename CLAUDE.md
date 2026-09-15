# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Package manager is pnpm (`packageManager: pnpm@10.10.0`).

- `pnpm dev` — start the dev server (http://localhost:3000)
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — run ESLint (flat config in [eslint.config.mjs](eslint.config.mjs))

There is no test suite configured yet — no test script, runner, or `*.test.*` files exist in the repo.

## Architecture

This is a Next.js App Router project, currently at the default `create-next-app` scaffold stage — [app/layout.tsx](app/layout.tsx) and [app/page.tsx](app/page.tsx) are the only routes so far, so there is no established routing/data-fetching pattern to follow yet beyond what App Router itself dictates.

- **Routing**: App Router only (`app/` directory) — there is no `pages/` directory.
- **Path alias**: `@/*` resolves to the repo root (see [tsconfig.json](tsconfig.json)).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` ([postcss.config.mjs](postcss.config.mjs)); global styles in [app/globals.css](app/globals.css). There is no `tailwind.config.*` — v4 configures via CSS/PostCSS.
- **Fonts**: Geist Sans/Mono loaded via `next/font/google` in [app/layout.tsx](app/layout.tsx), exposed as CSS variables (`--font-geist-sans`, `--font-geist-mono`).
- **TypeScript**: strict mode on; `moduleResolution: bundler`.

## Critical: this Next.js version is unfamiliar

Per [AGENTS.md](AGENTS.md), this project runs a Next.js version with breaking changes relative to what training data assumes. Before writing or editing any route, layout, config, or data-fetching code, read the relevant guide under `node_modules/next/dist/docs/` (sections: `01-app`, `02-pages`, `03-architecture`, `04-community`) rather than relying on prior Next.js knowledge — especially for anything touching routing conventions, config shape, or APIs that seem to have changed (e.g. `LayoutProps`/`PageProps` typing, as used in [app/layout.tsx](app/layout.tsx)).
