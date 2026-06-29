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
├── index.ts              # Entry point — re-exports all public API
├── chart/
│   ├── config.ts         # Types, interfaces, defaults, margins, utilities
│   ├── chart.ts          # Chart factory (waterfallChart function, getter/setters)
│   ├── render.ts         # Rendering: grid, axes, bars, connectors, trend lines
│   └── lifecycle.ts      # Data preparation: cumulative totals, total bar
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
npm run build          # Production build (Rollup, 4 formats)
npm run build:fast     # Fast build (CJS only)
npm run build:ts       # TypeScript type-check
npm run build:full     # TypeScript + Rollup
npm test               # Jest tests
npm run test:coverage  # Tests with coverage
npm run lint           # ESLint
npm start              # Local demo server (port 8080)
```

## Code Style

- **Semicolons:** Required
- **Quotes:** Double quotes
- **File naming:** kebab-case.ts for modules
- **Imports:** Use `.js` extension for relative TypeScript imports (ESM convention)

## Testing

- **Framework:** Jest 30 with jsdom environment
- **Setup:** `tests/setup.js` creates JSDOM, mocks Canvas/SVG
- **D3 mock:** `tests/__mocks__/d3.js`
- **Coverage:** 60%+ target
- Test files: `tests/*.test.{js,ts}`

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
