# AGENTS.md — MintWaterfall Development Guide

## Project Overview

MintWaterfall is a TypeScript waterfall chart library built on D3.js v7. It provides interactive SVG waterfall charts with data processing, statistical analysis, themes, accessibility, and enterprise-grade performance. Published to npm as `mintwaterfall`.

- **Author:** David Duarte
- **License:** MIT
- **Repo:** https://github.com/coredds/MintWaterfall
- **Node:** >= 18.0.0
- **D3 peer:** ^7.0.0

## Architecture

```
src/
├── index.ts              # Main entry — chart + supported helpers
├── experimental.ts       # "mintwaterfall/experimental" — brush, zoom, performance, interactions, layouts (no semver guarantees)
├── chart/
│   ├── config.ts         # Types, defaults, y-domain + layout/margin helpers
│   ├── chart.ts          # Chart factory: getter/setters, render orchestration, events, tooltip, brush, zoom, export
│   ├── render.ts         # Draw functions (grid, axes, bars, labels, connectors, trend, bands, milestones)
│   ├── style.ts          # Resolves theme → visual style tokens
│   └── lifecycle.ts      # Data preparation: running totals, subtotals, total bar
├── data/
│   ├── validation.ts     # Types, validateData(), getDataSummary()
│   ├── transforms.ts     # transformToWaterfallFormat, aggregate, sort, filter, etc.
│   ├── advanced.ts       # D3 group/rollup/cross/index, temporal aggregation
│   └── pipeline.ts       # createDataProcessor(), standalone helpers
├── statistics.ts         # Statistical analysis system
├── accessibility.ts      # WCAG 2.1 compliance (ARIA, keyboard nav)
├── themes.ts             # Theme system, color scales
├── animations.ts         # Animation/transition system
├── brush.ts              # Brush selection
├── scales.ts             # Scale system (band, linear, ordinal, time)
├── performance.ts        # Performance optimization + spatial indexing
├── interactions.ts       # Drag, hover, force simulation
├── layouts.ts            # Hierarchical + basic layouts
├── export.ts             # SVG, PNG, JSON, CSV export
├── tooltip.ts            # Tooltip system
├── zoom.ts               # Zoom/pan
└── shapes.ts             # Shape generators
```

## Development Commands

```bash
npm run build          # Production build (Rollup, 4 formats) + tsc declarations → dist/types
npm run build:fast     # Fast build (CJS only) + declarations
npm run typecheck      # TypeScript type-check (alias: build:ts)
npm test               # Jest (both projects, with coverage + threshold)
npm run lint           # ESLint (src/**/*.ts, tests, js)
npm run demo           # Build, then serve demo on port 8080 (node scripts/serve.mjs)
npm run test:e2e       # Playwright browser + screenshot tests (run after a build)
npm run check:size     # Bundle gzip budgets
npm run check:package  # Packed-tarball consumer check (types nodenext/bundler, ESM, CJS)
```

Visual check without a dev server (Windows, Edge headless):
`msedge --headless=new --window-size=1280,3400 --virtual-time-budget=5000 --screenshot=out.png file:///<repo>/mintwaterfall-example.html`

## Code Style

- **Semicolons:** Required
- **Quotes:** Double quotes
- **File naming:** kebab-case.ts for modules
- **Imports:** Use `.js` extension for relative TypeScript imports (ESM convention)

## Testing

- **Framework:** Jest 30 with jsdom, two projects in `jest.config.json`:
  - `unit` — `tests/*.test.{js,ts}`, uses the D3 mock `tests/__mocks__/d3.js` and `tests/setup.js` (Canvas/SVG mocks). Good for API/getter-setter and pure data tests; it cannot verify rendering.
  - `dom` — `tests/dom/*.test.ts`, real D3 in jsdom. Use this for anything that renders. Render with `.duration(0)` so output is synchronous. jsdom lacks `SVGSVGElement.viewBox`/`getBBox`, and `URL.createObjectURL` must be stubbed.
- **Coverage:** global threshold in `jest.config.json` is a ratchet (currently ~49% lines) — raise it when coverage improves, never lower it.
- **Browser (Playwright):** `e2e/` — `demo.spec.ts` (functional: keyboard, tooltip, brush/zoom gestures, responsive, PNG export) and `visual.spec.ts` (screenshots). D3 is served from `node_modules` (no CDN) and reduced motion is emulated so renders are static. `e2e/fixture.html` is a blank page for custom scenarios.
  - Screenshot baselines are per platform in `e2e/__screenshots__/{win32,linux}/`. Locally on Windows the installed Edge is used. In CI (Linux), screenshot tests skip until Linux baselines exist — run the **Update visual baselines** workflow (manual dispatch) to create/refresh them.
  - After an intended visual change: `npm run test:e2e:update`, then review the changed PNGs before committing.

## Build Pipeline

- **Bundler:** Rollup 4
- **TypeScript:** @rollup/plugin-typescript
- **Output:** CJS, ESM, UMD, minified UMD
- **Externals:** d3 and d3-* subpackages
- **Entry:** `src/index.ts`

## Commit Conventions

- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code change without feature/fix
- `chore:` — build, deps, config
- `test:` — test changes
- `docs:` — documentation
