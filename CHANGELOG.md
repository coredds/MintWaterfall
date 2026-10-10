# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Confidence bands and milestones were unreachable.** The `confidenceBands()`, `enableConfidenceBands()`,
  `milestones()`, `enableMilestones()` and `addMilestone()` settings were lost in the chart
  rewrite before 1.0.0, so the chart drew neither. They are back (typed, with `ConfidenceBandConfig`,
  `MilestoneConfig` and `Milestone` exported).
- Confidence bands added subtotal and total bars to the running totals again (they already show the
  running total) and didn't reset at opening balances, so the band drifted away from the bars after
  the first subtotal. `createWaterfallConfidenceBands` now accepts `subtotal` / `start` flags on
  baseline items and matches scenario entries to bars **by label** (by position only for entries
  without a label).
- `validateColorContrast` now computes the WCAG 2.x contrast ratio (sRGB relative luminance). It
  previously used a brightness approximation that badly underestimated mid-tone contrast
  (`#767676` on white: 2.0:1 instead of 4.54:1). Unparseable colors give a ratio of 1 instead of `NaN`.
- `createAccessibilitySystem().makeAccessible()`: arrow keys on a focused bar threw (each bar only
  knew about itself); Escape now returns focus to this chart rather than the first chart on the page.
- Importing the package no longer injects a `<style>` element into `document.head` (the package is
  declared side-effect free). `makeChartAccessible()` and `injectForcedColorsCSS()` still inject it.
- `exportPDF` never found jsPDF loaded from its UMD build (which defines `window.jspdf.jsPDF`, not
  `window.jsPDF`). It also accepts the constructor directly: `exportPDF(container, { jsPDF })`.
- `interpolateThemeColor` (and `colorMode("sequential")`) returned an invalid color when all values were equal.
- `createScaleSystem().createTimeScale()` replaced the scale's `tickFormat` with a date formatter, so
  D3 axes on it showed `NaN` ticks and `scaleUtils.formatTickValue` threw. The automatic format is
  now returned by `tickFormat()` while keeping D3's `tickFormat(count, specifier)` contract.
- Scale system edge cases: empty input gave `NaN` linear/time domains and an adaptive *time* scale
  (now d3's default domain and a band scale); `getScaleInfo` reports log scales as `"log"`.
- `groupWaterfallData` ignored its `labelAccessor`; it is now called with the first record of each group.

### Security

- CSV/TSV export (`chart.export("csv")`, `exportData`) prefixes text cells that a spreadsheet
  would evaluate as a formula (`=`, `+`, `-`, `@`, tab, CR) with `'`, so chart labels from untrusted
  data can't inject formulas. Numbers and numeric text like `"-5"` are unchanged. Opt out with
  `exportData(rows, { escapeFormulas: false })`.

### Changed

- `d3-array`, `d3-color`, `d3-drag` and `d3-force` are no longer dependencies: everything is imported
  from the `d3` peer dependency, so installs no longer pull separate copies.
- `version` is generated from `package.json` (`npm version` runs `scripts/sync-version.mjs`).
- Test coverage 51% → 64% (shapes, themes, scales, data pipeline and accessibility now tested against real D3).

## [2.1.0] - 2026-10-04

### Added

- **Typed events:** `chart.on("barClick", (event, d) => …)` now types `d` as `ProcessedData`
  (and `chartUpdate` / `brushSelection` get their own signatures). Namespaced names such as
  `"barClick.analytics"` keep the same types; unknown event names are a compile error.
- Literal types for `theme()`, `trendLineType()` and `trendLineStyle()`.
- Exported types: `ChartEventMap`, `ChartEventName`, `ThemeName`, `TrendLineType`, `TrendLineStyle`,
  plus the option and system types referenced by the public API (`TooltipConfig`, `Theme`,
  `StatisticalSystem`, `DataProcessor`, …).
- API reference generated with TypeDoc (`npm run docs:api`), published at `/api/` on the demo site.
- Compile-time tests for the public typings (`tests/types`, run by `npm run typecheck`).
- **Opening balances:** `{ label, start: true, stacks }` draws a bar from zero in the total color and
  resets the running total to its value (previously a first "Opening" bar was shown as a green increase).
- **`valueLabel((d, defaultText) => string)`** customises value labels; return `""` to hide one.
  Label sizing measures the custom text.
- **`tooltipContent((d, defaultHtml) => html)`** extends or replaces the tooltip. `escapeHtml` is now exported.
- **`showLegend(true)`**: segment labels (with their colors) for stacked charts, otherwise the bar kinds
  shown (increase, decrease, subtotal, total, opening). The plot moves down to make room; long legends wrap.
- **`theme("auto")`** follows `prefers-color-scheme` (default ↔ dark) and re-renders when it changes.
  A `totalColor()` set after the theme is respected.
- **`orientation("horizontal")`**: categories down the left axis, values along the bottom. Supports
  bars, stacked segments, value labels (placed past the bar ends, with room reserved), connectors,
  trend lines, legend, tooltips, keyboard navigation, themes and export. Long category labels are
  truncated with the full text in a `<title>`. Brush, zoom, `scaleType("time")`, confidence bands and
  milestones are vertical-only and are ignored with a one-time console warning. The demo's P&L chart
  has a Vertical/Horizontal toggle.
- `BarKind` type and `is-start` CSS class on opening bars; CSV export reports `start` rows.
- README image of the chart, generated from the real bundle by `scripts/readme-image.mjs`.

### Security

- Dev/build dependencies: `npm audit` 45 → 0 vulnerabilities (`npm audit fix`, `@rollup/plugin-terser`
  1.0, and an override pinning a patched `brace-expansion` under ESLint's `minimatch@3`). The published
  package's runtime dependencies were already clean. The weekly security workflow now audits all
  dependencies, not only production ones. Building from source needs Node 20+.

### Fixed

- `scaleType("time")` rendered every bar at `NaN` (labels were passed to the time scale as strings).
  Bars are now placed by date, sized by the smallest gap between dates so they never overlap, and
  the axis uses date ticks. Trend lines, connectors, confidence bands and milestones work too.
- Confidence-band scenario values of `0` were ignored (treated as missing).

### Changed

- Chart rendering code is typed (scales, data callbacks, selections): `any` in `src/chart`
  dropped from 83 to 22, the remainder being the D3 reusable-chart accessor wiring.
- `createWaterfallConfidenceBands` / `createWaterfallMilestones` also accept a function returning
  a label's centre x, in addition to a band scale.

## [2.0.0] - 2026-10-03

Scope cleanup: the package entry now contains the chart and the helpers it is built from.
Modules unrelated to the chart move to a separate, explicitly unstable entry point.

### Breaking changes

- **Moved to `mintwaterfall/experimental`:** `createBrushSystem`, `createZoomSystem`,
  `createPerformanceManager`, `createAdvancedPerformanceSystem`, `createWaterfallSpatialIndex`,
  `createVirtualWaterfallRenderer`, `createAdvancedInteractionSystem`, `createWaterfallDragBehavior`,
  `createWaterfallVoronoiConfig`, `createWaterfallForceConfig`, `createHierarchicalLayout`,
  `createHierarchicalLayoutSystem`, `createWaterfallTreemap`, `createWaterfallSunburst`,
  `createWaterfallBubbles`. These are not used by the chart, have limited test coverage and are
  not covered by semver guarantees. Script-tag users: load `dist/mintwaterfall-experimental.min.js`
  (global `MintWaterfallExperimental`).
- **Removed chart settings** that never had any effect: `breakdownConfig`,
  `enablePerformanceOptimization`, `performanceDashboard`, `virtualizationThreshold`.

### Migration

```diff
- import { waterfallChart, createHierarchicalLayout } from "mintwaterfall";
+ import { waterfallChart } from "mintwaterfall";
+ import { createHierarchicalLayout } from "mintwaterfall/experimental";
```

Delete any calls to the four removed settings; they did nothing. For brushing and zooming a chart,
prefer the built-in `chart.enableBrush(true)` / `chart.enableZoom(true)`.

### Added

- Public chart types are exported: `ChartData`, `StackData`, `ProcessedData`, `WaterfallChart`,
  `MarginConfig`, `ChartEventType`, `ChartExportFormat`.

### Changed

- Main bundle is ~25% smaller (minified UMD 36.4 → 27.3 KB gzip); size budgets tightened accordingly.
- CI runs on Node 20, 22 and 24; actions updated to Node 24 runtimes. Publishing is gated on the
  size and package checks and uses npm provenance.

## [1.1.0] - 2026-10-03

### Added

- **Subtotal bars** — `{ label, subtotal: true }` draws the running total from zero without changing it.
- **Optional stack colors** — omit `color` and bars are colored as increase / decrease / total (or from the theme palette when stacked).
- **Interaction wiring** — `barClick`, `barMouseover`, `barMouseout`, `barFocus`, `chartUpdate` and `brushSelection` events now actually fire.
- **Tooltips** — `enableTooltips(true)` shows change, running total and stack breakdown (HTML-escaped).
- **Keyboard & screen-reader support in the chart** — focusable bars (`role="listitem"`, descriptive `aria-label`), arrow/Home/End navigation, Enter/Space to activate, and a generated chart summary (`<title>` + `aria-label`).
- **Brush** — `enableBrush(true)` adds an x-brush; selected bars are emphasised and emitted via `brushSelection`.
- **Zoom** — `enableZoom(true)` adds horizontal zoom/pan (`zoomConfig({ scaleExtent })`). With the brush also enabled, drag selects, Shift+drag pans and the wheel zooms; zooming clears a stale brush selection. Zoom renders are coalesced to one per animation frame.
- **`chart.export(format)`** — `"svg" | "png" | "json" | "csv"` export of the last render.
- **`chart.destroy()`** — removes the tooltip and detaches zoom/brush listeners.
- New accessors: `responsive`, `showValueLabels`, `showConnectors`, `showGrid`, `barRadius`.
- Real-D3 DOM test suite (`tests/dom/`) and a coverage threshold.
- Playwright browser tests (`e2e/`): functional checks plus screenshot comparisons; CI also enforces bundle-size budgets and verifies the packed tarball (types under `nodenext`/`bundler`, ESM and CJS loading).
- `npm run demo` / `npm start` use a small Node static server (`scripts/serve.mjs`) instead of Python.

### Changed

- **Visual refresh** — new default palette, rounded bars, signed value labels (`+1,200` / `−450`), lighter subtotal bars, subtle grid with an emphasised zero line, cleaner axes, wrapped (or rotated) x labels, hover emphasis, modern tooltip styling.
- **Themes** restyle the whole chart (background, grid, axes, text) and color bars by increase/decrease; palettes modernised (`accessible` now uses Okabe–Ito).
- Defaults: `margin` `{32,24,48,56}` (left margin auto-grows for tick labels), `barPadding` `0.24`, `duration` `650`, `ease` `easeCubicOut`, `formatNumber` `",.0f"`, `totalColor` `#475569`.
- Polynomial trend lines are now a real least-squares fit; moving averages use a centered window.
- Animations are disabled when the user prefers reduced motion.
- `responsive(true)` now lays the chart out at the container's real width (re-rendering on resize via `ResizeObserver`) instead of scaling a fixed drawing, so text stays readable on phones.
- Crowded charts degrade gracefully: value labels shrink to 10px or hide when they don't fit, rotated x labels are thinned, and stack segment labels only show when they fit.
- Exports pad with the theme background instead of white.
- The y axis only rounds out to a "nice" tick when that wastes ≤10% of the range (a running total dipping to −8 no longer adds a whole empty −1,000 band).
- Trend lines ignore total/subtotal bars, which repeated running totals and skewed the fit.
- CommonJS bundle renamed to `dist/mintwaterfall.cjs` so `require()` works with `"type": "module"`.
- `dist/` is no longer committed; the Pages workflow builds and publishes only the demo and bundles.

### Fixed

- **Published types** — `dist/index.d.ts` pointed at a non-existent path; declarations are now emitted by `tsc` to `dist/types/`.
- **Y axis did not include zero** for all-positive data, so bars were drawn with misleading lengths.
- Stale renders: the data cache only compared the first 100 characters of the data.
- Each re-render appended a new `<defs>`/`<clipPath>`.
- Rendering overwrote the configured `width`/`height`.
- Value labels for decreases were placed inside the bar; labels below zero overlapped the axis.
- Confidence bands, milestones and trend lines were not removed when disabled.
- Tooltip default content inserted labels as raw HTML (XSS).
- PNG export failed on non-Latin-1 text and ignored the scale factor.
- Moving-average edge values were biased.

### Deprecated

- `breakdownConfig`, `enablePerformanceOptimization`, `performanceDashboard`, `virtualizationThreshold` have never had any effect; they remain as no-op accessors and will be removed in 2.0.

## [1.0.0] - 2026-06-29

### Changed

- **TypeScript migration complete** — all source files now `.ts`, entry point is `src/index.ts`
- **Module restructuring** — chart split into `src/chart/{config,chart,render,lifecycle}.ts`, data split into `src/data/{validation,transforms,advanced,pipeline}.ts`
- **Merged enterprise scaffolding** — removed empty placeholder files (`src/enterprise/`, `src/features/`, `src/utils/`)
- **Consolidated modules** — merged advanced variants into base modules, dropped `mintwaterfall-` prefix on all files
- **Removed D3 namespace mutation** — `window.d3.waterfallChart` no longer set (UMD build still provides script-tag access)
- **Demo replaced** — 4000-line demo → minimal working example
- **CI/CD consolidated** — 8 workflows → 4, added TypeScript type-check step
- **Added AGENTS.md** — development conventions, architecture, commands

### Fixed

- **Type declarations** — restored `index.d.ts` for downstream consumers
- **Jest config** — updated `testMatch` for TS test files, fixed module paths
- **CHANGELOG/README/CONTRIBUTING** — updated for v1.0.0 structure

### Removed

- **`mintwaterfall-chart-core.ts`** — duplicate chart implementation
- **`mintwaterfall-advanced-data.ts`** — merged into `src/data/advanced.ts`
- **`mintwaterfall-advanced-performance.ts`** — merged into `src/performance.ts`
- **`mintwaterfall-advanced-interactions.ts`** → renamed to `src/interactions.ts`
- **`mintwaterfall-hierarchical-layouts.ts`** → merged into `src/layouts.ts`
- **Legacy test directories** — `tests/compatibility/`, `tests/enterprise/`

## [0.8.10] - 2026-02-09

### Changed

- **Dependencies Update**: Updated all dev dependencies to latest compatible versions
  - `@babel/core`: 7.28.5 → 7.29.0
  - `@babel/preset-env`: 7.28.5 → 7.29.0
  - `eslint`: 9.39.1 → 9.39.2
  - `prettier`: 3.7.4 → 3.8.1
  - `rollup`: 4.53.3 → 4.57.1
- **GitHub Actions Modernized**: Updated all CI/CD workflows
  - Node.js CI matrix updated from [18.x, 20.x] to [20.x, 22.x]
  - Replaced deprecated `actions/create-release@v1` with `softprops/action-gh-release@v2`
  - Updated `codecov/codecov-action` from v4 to v5
  - All workflows now use Node.js 22.x and npm caching
- **Engine requirement**: Updated `engines.node` from `>=14.0.0` to `>=18.0.0` to reflect actual minimum
- **ESLint config**: Fixed flat config `ignores` so `coverage/` directory is properly excluded

### Fixed

- **Security**: Resolved high-severity vulnerability in `@isaacs/brace-expansion`
- **publish.yml**: Added missing `build` step before `npm publish`
- **security.yml**: Removed redundant duplicate audit step
- **Version mismatches**: Corrected stale fallback versions in rollup configs (0.8.7 → 0.8.10)
- **Copyright years**: Updated banner copyright to 2024-2026
- **Type definitions header**: Updated `index.d.ts` version from v0.6.0 to v0.8.10
- **Demo files**: Updated version references in example HTML

### Technical

- All 338 tests passing across 18 test suites
- Zero vulnerabilities
- Build and lint verified clean

## [0.8.9] - 2025-12-08

### Changed

- **Dependencies Update**: Updated all dev dependencies to latest compatible versions
  - `@babel/core`: 7.28.4 → 7.28.5
  - `@babel/preset-env`: 7.28.3 → 7.28.5
  - `@babel/preset-typescript`: 7.27.1 → 7.28.5
  - `@rollup/plugin-babel`: 6.0.4 → 6.1.0
  - `@rollup/plugin-node-resolve`: 16.0.2 → 16.0.3
  - `@rollup/plugin-typescript`: 12.1.4 → 12.3.0
  - `eslint`: 9.37.0 → 9.39.1
  - `prettier`: 3.6.2 → 3.7.4
  - `lint-staged`: 16.2.3 → 16.2.7
  - `rollup`: 4.52.4 → 4.53.3
  - `rimraf`: 6.0.1 → 6.1.2
  - `jsdom`: kept at 26.1.0 (v27 has breaking changes)

### Fixed

- Code formatting updated to comply with Prettier 3.7.4

### Technical

- All 338 tests passing across 18 test suites
- Zero vulnerabilities
- All formatting checks passing

## [0.8.8] - 2025-10-09

### Changed

- **Dependencies Update**: Updated all dev dependencies to latest compatible versions
  - `@babel/core`: 7.28.3 → 7.28.4
  - `@rollup/plugin-node-resolve`: 16.0.1 → 16.0.2
  - `babel-jest`: 30.0.5 → 30.2.0
  - `eslint`: 9.33.0 → 9.37.0
  - `jest`: 30.0.5 → 30.2.0
  - `jest-environment-jsdom`: 30.0.5 → 30.2.0
  - `lint-staged`: 16.1.5 → 16.2.3
  - `rollup`: 4.47.1 → 4.52.4
  - `typescript`: 5.9.2 → 5.9.3
  - `husky`: 8.0.0 → 9.1.7 (major)
  - `jsdom`: kept at 26.1.0 (v27 has compatibility issues)

### Technical

- All 338 tests passing across 18 test suites
- Zero vulnerabilities
- Build system verified with all updated tools
- CI/CD pipeline compatibility maintained

## [0.8.7] - 2025-09-11

### Fixed

- **🔗 Repository URL**: Updated placeholder repository URL from `https://github.com/your-username/mintwaterfall` to correct address `https://github.com/coredds/MintWaterfall` in TypeScript definition files

## [0.8.6] - 2025-09-04

### Added

- **🚀 Advanced D3.js Data Processing Features**: Complete Phase 1 implementation
  - `d3.group()` and `d3.rollup()` multi-dimensional grouping
  - `d3.flatRollup()` hierarchical data flattening
  - `d3.cross()` and `d3.index()` cross-tabulation and indexing
  - Temporal aggregation with `d3.timeMonth()` intervals
  - Revenue waterfall analysis with breakdown capabilities
  - Variance analysis for actual vs budget comparison
  - Period comparison with period-over-period analysis
  - Financial reducers with statistical functions (mean, variance, quantiles)
  - Transaction data transformation utilities
  - Comprehensive error handling and fallback mechanisms

### Enhanced

- **📊 Interactive Demo Section**: New advanced data processing showcase
  - Live demonstration buttons for each D3.js function
  - Real-time chart updates with processed data
  - Detailed explanations and performance metrics
  - Error handling with informative fallback data
- **🔧 Robust Error Handling**: Improved null-safety and data validation
  - Fixed NaN display issues in financial reducers
  - Added comprehensive try-catch blocks
  - Console debugging and logging enhancements
- **📚 API Documentation**: Updated with complete advanced features reference

### Technical

- **⚡ Performance Optimizations**: Efficient data processing pipelines
- **🔍 Debug Enhancements**: Comprehensive logging and error reporting
- **🧪 Type Safety**: Enhanced TypeScript interfaces for new features

## [0.8.5] - 2025-01-19

### Added

- **🧪 Complete Test Suite**: Comprehensive testing with 100% pass rate
  - 183 passing tests across 12 test suites
  - Enhanced features testing (scales, brush, animations)
  - Data processing validation with 50+ test cases
  - Chart functionality testing with 83+ test cases
  - Performance-optimized test execution (4.7s)

### Changed

- **🏗️ TypeScript Migration Complete**: Full TypeScript support with type safety
  - All core modules converted to TypeScript (.ts)
  - Complete type definitions for all APIs
  - Enhanced IntelliSense and developer experience
  - Backward compatibility maintained
- **🧹 Codebase Cleanup**: Removed unnecessary files and tests
  - Removed hierarchical layout functionality (not needed for waterfall charts)
  - Cleaned up intermediate migration documentation
  - Optimized test suite for faster execution
  - Removed obsolete console-based tests

### Fixed

- **🔧 Scale System Issues**: Fixed API mismatches and type issues
  - Enhanced scale factory with proper TypeScript interfaces
  - Fixed brush system with complete selection utilities
  - Resolved data processor method completeness
  - Improved chart API consistency

### Removed

- **📝 Hierarchical Layouts**: Removed unused hierarchical layout functionality
  - Treemap, partition, pack, cluster, tree visualizations removed
  - Focus on core waterfall chart functionality
  - Simplified codebase and reduced bundle size

## [0.8.1] - 2025-08-30

### Added

- **🏗️ Hierarchical Layout System**: Complete D3.js layout algorithm implementation
  - `d3.hierarchy()` support for hierarchical data structures
  - `d3.treemap()` for space-efficient breakdown visualizations
  - `d3.partition()` for hierarchical breakdowns (icicle and sunburst layouts)
  - `d3.pack()`, `d3.cluster()`, and `d3.tree()` layout algorithms
- **📊 Advanced Chart Components**: New specialized chart types
  - `treemapChart()` - Space-efficient hierarchical visualization
  - `partitionChart()` - Flexible icicle and sunburst charts
  - `sunburstChart()` - Radial hierarchical visualization
- **🔧 Modern Data Processing**: Advanced D3.js data structures
  - `d3.group()` for multi-level data grouping operations
  - `d3.rollup()` for data aggregation and summarization
  - Cross-tabulation, time series, and summary utilities
  - Efficient data transformation pipelines
- **⚡ Performance Optimization System**: Enterprise-grade performance
  - Data virtualization for >100K data points
  - Incremental update patterns for efficient rendering
  - Memory optimization with automatic cleanup
  - Real-time performance monitoring and metrics
  - Configurable chunk processing and render thresholds
- **📈 Performance Dashboard**: Real-time monitoring capabilities
  - Render time, memory usage, and FPS tracking
  - Benchmark testing across different dataset sizes
  - Performance comparison with/without optimizations
- **🎯 Power BI Integration Ready**: Enhanced D3.js feature coverage
  - Layout algorithms for advanced breakdown visualizations
  - Modern data structures for complex transformations
  - Performance optimizations for large enterprise datasets

### Enhanced

- **Chart API**: Extended with performance configuration methods
  - `enablePerformanceOptimization()` - Toggle performance features
  - `performanceDashboard()` - Real-time metrics display
  - `virtualizationThreshold()` - Configure large dataset handling
  - `getPerformanceMetrics()` - Access performance data
- **Data Processing**: Advanced transformation capabilities
  - Hierarchical data conversion utilities
  - Waterfall format transformation from any data structure
  - Efficient filtering and aggregation for large datasets
- **Browser Compatibility**: Improved module system integration
  - Better D3.js namespace integration
  - Enhanced error handling and fallbacks

### Performance

- **Large Dataset Support**: Handles >500K data points efficiently
- **Memory Management**: Automatic cleanup and garbage collection triggers
- **Render Optimization**: Smart sampling and virtualization strategies
- **Response Time**: <100ms updates for incremental data changes
- **Load Time**: <2s initial render for 100K+ data points

### Documentation

- **HIERARCHICAL_LAYOUTS.md**: Comprehensive guide for new layout features
- **API Documentation**: Updated with all new methods and options
- **Performance Examples**: Interactive demos for testing optimizations

## [0.6.0] - 2025-08-28

### Added

- **📈 Trend Line Overlays**: Complete trend analysis system with linear, moving average, and polynomial options
- **🔄 Enhanced Data Loading**: CSV, JSON, TSV format support with HTTP URL loading and automatic format detection
- **🖼️ High-DPI PNG Export**: 2x scaling support with enhanced image quality and comprehensive error handling
- **♿ Modern Accessibility**: Forced Colors Mode support with CSS system colors, deprecated `-ms-high-contrast` removed
- **🧪 Comprehensive Testing**: 27 new test cases covering trend lines, data loading, and export functionality (206 total tests)
- **🎨 Interactive Demo Integration**: Trend line demonstration integrated into main demo with live controls and styling options
- **⚙️ Real-time Configuration**: Dynamic trend line styling with color, width, style, and algorithm parameter controls
- **📚 Educational Information**: Contextual explanations for each trend type with technical details

### Fixed

- **ESLint Compliance**: All linting issues resolved with modern code standards
- **Deprecated API**: Removed legacy accessibility detection methods in favor of W3C Forced Colors Mode standard
- **Code Quality**: Unused variables properly handled with appropriate ESLint disable comments for future-use functions

### Changed

- **Accessibility System**: Enhanced with automatic CSS injection for forced colors mode support
- **Export System**: Improved PNG generation with high-DPI support and better error handling
- **Demo Experience**: Consolidated trend line features into main demonstration page for unified user experience

## [0.5.6] - 2025-08-22

### Added

- **Enhanced D3.js v7 compatibility**: Full scale system support for band, linear, ordinal, and time scales
- **Advanced interactive features**: Brush system for data filtering and selection
- **Staggered animations**: Enhanced visual feedback with progressive reveal animations
- **Scale switching capabilities**: Dynamic switching between different scale types
- **Utility functions**: `getBarWidth()` and `getBarPosition()` for cross-scale compatibility

### Fixed

- **Brush system errors**: Resolved `scale.invert is not a function` for band scales
- **Scale bandwidth errors**: Fixed `xScale.bandwidth is not a function` when switching scale types
- **D3 v7 API compatibility**: Removed deprecated `cornerRadius()` and `handleSize()` brush methods
- **Animation toggling**: Enhanced staggered animation toggle for immediate visual feedback

### Changed

- **Test coverage**: Increased from 121 to 168 comprehensive test cases
- **Code organization**: Improved scale handling with dedicated utility functions
- **Performance**: Optimized rendering for different scale types
- **Documentation**: Updated API documentation with new advanced features

### Technical Details

- All 168 tests passing with 51% code coverage
- Zero lint issues maintained
- Production-ready status achieved
- Enhanced error handling and debugging capabilities

## [0.5.5] - 2025-08-XX

### Added

- **Comprehensive testing**: 121 test cases with 57% code coverage
- **Enhanced functionality**: Fixed normalize/bounce buttons, improved UI/UX
- **Visual improvements**: 1100px wide charts, centered layouts, visual feedback system
- **Complete CI/CD pipeline**: Automated testing, security audits, deployment
- **Documentation**: Updated README, API docs, and examples

### Changed

- **Code quality**: Achieved zero lint issues, professional codebase standards
- **Performance**: Optimized bundle size and rendering efficiency

## [0.5.4] - 2025-08-XX

### Added

- Initial production release
- Basic waterfall and stacked chart functionality
- D3.js integration
- Animation system
- Theme support

### Technical

- Core chart rendering engine
- Data processing pipeline
- Event handling system
- Basic test suite setup

---

## Versioning Guidelines

- **Major version** (X.0.0): Breaking changes, major API overhauls
- **Minor version** (0.X.0): New features, enhancements, non-breaking changes
- **Patch version** (0.0.X): Bug fixes, documentation updates, maintenance

## Support

For questions about specific versions or upgrade paths, please:

- Check the [API documentation](API.md)
- View [examples](mintwaterfall-example.html)
- File an [issue](https://github.com/coredds/MintWaterfall/issues)
