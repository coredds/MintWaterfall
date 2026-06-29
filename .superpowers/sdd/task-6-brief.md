# Task 6: Delete old monolithic chart files

**Files:**
- Delete: `src/mintwaterfall-chart.ts` (1915 lines, now replaced by `src/chart/`)
- Delete: `src/mintwaterfall-chart-core.ts` (296 lines, duplicate/simpler implementation)

## Steps

- [ ] **Step 1: Remove old chart files**

```powershell
Remove-Item -LiteralPath "src\mintwaterfall-chart.ts"
Remove-Item -LiteralPath "src\mintwaterfall-chart-core.ts"
```

- [ ] **Step 2: Verify TypeScript compiles — errors expected from untransitioned imports**

```bash
npx tsc --noEmit
```
Expected: errors in `src/index.js` because it still imports from `./mintwaterfall-chart.ts` which no longer exists. This is expected — `src/index.js` will be replaced in Task 9.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "refactor: remove old monolithic chart files, replaced by src/chart/"
```

## Global Constraints

- No public API breakage
- All 4 build output formats must build: CJS, ESM, UMD, minified UMD
- No dependency version bumps
- No new features
