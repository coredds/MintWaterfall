# MintWaterfall Modernization Design

**Date:** 2026-06-29
**Status:** Approved
**Version:** v0.8.10 -> v1.0.0

## Goals

Pragmatic modernization of the MintWaterfall waterfall chart library. No public API breakage. Improve code quality, maintainability, and test coverage while preserving backward compatibility.

## Scope

### In Scope

1. **Finish TypeScript migration** — convert all remaining `.js` source files to `.ts`, make `src/index.ts` the entry point, remove the JS compatibility layer
2. **Split monoliths** — break `mintwaterfall-chart.ts` (1273 lines) and `mintwaterfall-data.ts` (1100 lines) into focused sub-modules with clear responsibilities
3. **Flatten enterprise features** — merge `src/enterprise/` and `src/features/` into flat, tree-shakeable modules in `src/`
4. **Standardize testing** — migrate all non-Jest tests to Jest, target 60%+ coverage
5. **Collapse demo files** — replace 4000-line demo with a minimal example; move full demo to a separate repo or link externally
6. **Add AGENTS.md** — document conventions, commands, and architecture for AI tooling
7. **Remove D3 namespace mutation** — drop `window.d3.waterfallChart` (UMD build still provides script-tag access)

### Out of Scope

- Public API changes (all existing methods remain unchanged)
- Removing any chart features
- Changing runtime dependencies (d3 subpackages)
- Altering build output formats (CJS, ESM, UMD, minified UMD)
- Dropping supported Node versions

## Architecture

### Module Restructuring

**Current structure (simplified):**
```
src/
├── index.js                         # JS entry, D3 namespace attach
├── mintwaterfall-chart.ts           # 1273L — monolithic chart
├── mintwaterfall-chart-core.ts      # Additional chart core
├── mintwaterfall-data.ts            # 1100L — monolithic data pipeline
├── mintwaterfall-advanced-data.ts   # Advanced D3 data ops
├── mintwaterfall-statistics.ts      # 821L
├── mintwaterfall-accessibility.ts   # 680L
├── mintwaterfall-themes.ts          # 391L
├── mintwaterfall-animations.ts
├── mintwaterfall-brush.ts
├── mintwaterfall-scales.ts
├── mintwaterfall-performance.ts
├── mintwaterfall-advanced-performance.ts
├── mintwaterfall-advanced-interactions.ts
├── mintwaterfall-hierarchical-layouts.ts
├── mintwaterfall-layouts.ts
├── mintwaterfall-export.ts
├── mintwaterfall-tooltip.ts
├── mintwaterfall-zoom.ts
├── mintwaterfall-shapes.ts
├── enterprise/
│   ├── enterprise-core.js
│   ├── enterprise-feature-template.js
│   ├── feature-registry.js
│   └── features/breakdown.js
├── features/
│   ├── breakdown.js
│   └── conditional-formatting.js
├── types/
│   └── js-modules.d.ts
└── utils/
    └── compatibility-layer.js
```

**Target structure:**
```
src/
├── index.ts                         # TS entry, no D3 namespace
├── chart/
│   ├── chart.ts                     # Core chart class (~400L)
│   ├── render.ts                    # Rendering pipeline (~300L)
│   ├── config.ts                    # Configuration/defaults (~200L)
│   └── lifecycle.ts                 # Mount/update/destroy (~200L)
├── data/
│   ├── pipeline.ts                  # Data processing pipeline (~400L)
│   ├── transforms.ts                # Data transformations (~300L)
│   ├── validation.ts                # Input validation (~200L)
│   └── advanced.ts                  # Advanced D3 data ops (~200L)
├── statistics.ts                    # Statistical analysis (unchanged scope)
├── accessibility.ts                 # WCAG 2.1 compliance (unchanged scope)
├── themes.ts                        # Theme system (unchanged scope)
├── animations.ts                    # Animation/transition system
├── brush.ts                         # Brush selection
├── scales.ts                        # Scale system
├── performance.ts                   # Performance + advanced perf merged
├── interactions.ts                  # Advanced interactions
├── layouts.ts                       # Hierarchical + basic layouts merged
├── export.ts                        # Export (SVG, PNG, JSON, CSV)
├── tooltip.ts                       # Tooltip system
├── zoom.ts                          # Zoom/pan
├── shapes.ts                        # Shape generators
├── breakdown.ts                     # Flattened from enterprise/features
├── conditional-formatting.ts        # Flattened from features
└── types.ts                         # Shared type definitions (replaces types/)
```

### Key Changes

1. **Chart split** — The 1273-line chart becomes `chart/` with 4 files: chart core, render pipeline, config/defaults, and lifecycle. Each under 500 lines.

2. **Data split** — The 1100-line data module becomes `data/` with 4 files: pipeline, transforms, validation, and advanced operations.

3. **Enterprise flattening** — Remove `enterprise/` subtree entirely. Merge `breakdown.ts` and `conditional-formatting.ts` into `src/` as standard modules. Drop the feature registry and template (unused scaffolding).

4. **Module consolidation** — Merge `-advanced-` variants into their base modules where logical (performance, layouts). Keep `advanced-data` separate under `data/`.

5. **Entry point** — `src/index.ts` becomes the entry. Re-exports all public modules. No `window.d3` mutation. No compatibility layer (browser compat is handled by build targets).

6. **Types** — Inline type definitions into each module. Remove `src/types/` directory. Remove root `index.d.ts` (it gets generated from TS compilation).

## File Changes Summary

| File | Action |
|------|--------|
| `src/index.js` | Delete — replaced by `src/index.ts` |
| `src/mintwaterfall-chart.ts` | Split into `src/chart/` subdirectory |
| `src/mintwaterfall-chart-core.ts` | Merge into `src/chart/` |
| `src/mintwaterfall-data.ts` | Split into `src/data/` subdirectory |
| `src/mintwaterfall-advanced-data.ts` | Move to `src/data/advanced.ts` |
| `src/mintwaterfall-performance.ts` | Merge with `-advanced-performance.ts` |
| `src/mintwaterfall-advanced-performance.ts` | Merge into `src/performance.ts` |
| `src/mintwaterfall-advanced-interactions.ts` | Rename to `src/interactions.ts` |
| `src/mintwaterfall-hierarchical-layouts.ts` | Merge with `src/layouts.ts` |
| `src/mintwaterfall-layouts.ts` | Absorb hierarchical layouts |
| `src/enterprise/` (4 files) | Delete entire subtree |
| `src/features/breakdown.js` | Convert to `src/breakdown.ts` |
| `src/features/conditional-formatting.js` | Convert to `src/conditional-formatting.ts` |
| `src/types/js-modules.d.ts` | Inline types, delete directory |
| `src/utils/compatibility-layer.js` | Delete |
| `index.d.ts` (root) | Delete — TS generates declarations |
| `mintwaterfall-example.html` | Replace with minimal example |
| `analytical-enhancement-demo.html` | Remove (or move to separate demo repo) |

### Files Unchanged (internal refactor only)

- `statistics.ts`, `accessibility.ts`, `themes.ts`, `animations.ts`, `brush.ts`, `scales.ts`, `export.ts`, `tooltip.ts`, `zoom.ts`, `shapes.ts`

## Test Strategy

### Migration

- Convert `tests/enterprise/` and `tests/compatibility/` non-Jest tests to Jest
- Convert `tests/data/` helpers to TS
- Standardize on `.test.ts` extension

### Coverage Targets

| Module Group | Target |
|--------------|--------|
| `chart/` (core, render, config, lifecycle) | 70%+ |
| `data/` (pipeline, transforms, validation) | 70%+ |
| `statistics.ts` | 60%+ |
| `themes.ts`, `scales.ts` | 60%+ |
| `accessibility.ts` (existing 89.6%) | Maintain |
| `export.ts`, `tooltip.ts`, `zoom.ts` | 50%+ |
| `animations.ts`, `brush.ts`, `shapes.ts` | 40%+ |
| `breakdown.ts`, `conditional-formatting.ts` | 50%+ |
| **Overall** | **60%+** |

### Test Strategy

- Unit tests for data transforms, validation, statistics
- Integration tests for chart lifecycle (mount -> update -> destroy)
- Snapshot tests for themes and scales output
- DOM-based tests for accessibility and rendering
- D3 mock stays in place (no real DOM needed)

## Build & Tooling

- Rollup config: update entry from `src/index.js` to `src/index.ts`
- TS config: no changes needed (already strict, ES2020 target)
- ESLint: add rules for `.ts` extensions in imports
- All existing scripts (`npm run build`, `npm test`, etc.) continue to work

## Demo

Replace `mintwaterfall-example.html` (~4000 lines) with a minimal working example (~200 lines) showing:
- Basic waterfall chart with sample data
- One theme variant
- Link to live demo at https://coredds.github.io/MintWaterfall/

Remove `analytical-enhancement-demo.html` from the repo. Optionally move it to a separate `mintwaterfall-demos` repo.

## AGENTS.md

Document:
- Project overview and architecture
- Development commands (`npm run build`, `npm test`, `npm run lint`)
- Module conventions (naming, file structure, import patterns)
- Testing approach (Jest, JSDOM, D3 mocks)
- Build pipeline (Rollup, 4 output formats)
- PR/release process
- Code style (semicolons, double quotes, no-unused-vars)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking import paths for consumers | All public exports remain at `src/index.ts`; internal restructuring is transparent |
| Test breakage during migration | Migrate tests per-module, verify pass rate after each module |
| Demo page regression | New minimal demo tested against built UMD bundle |
| Build output changes | CI verifies all 4 bundle formats build and their exports match |

## Non-Goals (explicitly)

- No CSS/styling changes
- No new features
- No dependency version bumps (already at latest)
- No build tooling changes (Rollup stays, Jest stays, ESLint stays)
- No documentation changes beyond AGENTS.md and demo replacement
