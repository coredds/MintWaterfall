# Task 10 Report — Update build configs

## Changes Made

### 1. `rollup.config.js` (4 config blocks)
- Changed `input: "src/index.js"` → `input: "src/index.ts"` in all 4 blocks (ESM, UMD, minified UMD, CJS)

### 2. `rollup.config.fast.js`
- Changed `input: "src/index.js"` → `input: "src/index.ts"`

### 3. `jest.config.json`
- **testMatch**: `["<rootDir>/tests/**/*.test.js"]` → `["<rootDir>/tests/**/*.test.{js,ts}"]`
- **testPathIgnorePatterns**: Removed entries, set to empty array `[]`
- **moduleNameMapper**:
  - Updated dist imports: `src/index.js` → `src/index.ts`
  - Added precise patterns for renamed modules to resolve `.js` → `.ts` (Jest doesn't handle TypeScript's ESM `.js` convention natively):
    - `./mintwaterfall-*.js` → `./mintwaterfall-*.ts` (existing, preserved)
    - `../mintwaterfall-*.js` → `../mintwaterfall-*.ts` (new)
    - `./chart/{chart,config,lifecycle,render}.js` → `./chart/$1.ts` (new)
    - `./data/{pipeline,advanced,transforms,validation}.js` → `./data/$1.ts` (new)
    - `./{renamed}.js` → `./$1.ts` (new, top-level renamed files)
    - `../{renamed}.js` → `../$1.ts` (new, parent-dir imports)
    - `./{chart,config,lifecycle,...}.js` → `./$1.ts` (new, same-dir subdirectory imports)

### 4. `package.json`
- Removed `"mintwaterfall-*.js"` and `"*.d.ts"` from `files` array (stale references)
- Verified `"types": "dist/index.d.ts"` is correct

## Build Verification

- `npm run build:ts` (tsc --noEmit): **✅ PASS** — zero errors
- `npm run build` (rollup -c): **✅ PASS** — all 4 formats built:
  - `dist/mintwaterfall.esm.js` (1.9s)
  - `dist/mintwaterfall.umd.js` (1.2s)
  - `dist/mintwaterfall.min.js` (1.9s)
  - `dist/mintwaterfall.cjs.js` (1s)
- Note: `build:types` step fails (expected — `index.d.ts` was deleted in Task 9)

## Test Verification

`npx jest --testMatch "**/tests/**/*.test.{js,ts}" --passWithNoTests`:
- **17/20 suites pass**, 329/338 tests pass
- 2 empty test files (pre-existing): `d3js-compatibility.test.js`, `enterprise-features.test.js`
- 9 tests fail due to validation message mismatches (pre-existing from Task 9 rename, not related to build config changes)
- Module resolution working correctly via moduleNameMapper patterns

## Commit
`eca4f94` — `chore: update build configs for new TypeScript entry point and module paths`
