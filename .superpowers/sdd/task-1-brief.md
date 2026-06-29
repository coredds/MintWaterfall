# Task 1: Delete empty placeholder files

**Files:**
- Delete: `src/enterprise/enterprise-core.js` (empty)
- Delete: `src/enterprise/enterprise-feature-template.js` (empty)
- Delete: `src/enterprise/feature-registry.js` (empty)
- Delete: `src/enterprise/features/breakdown.js` (empty)
- Delete: `src/features/breakdown.js` (empty)
- Delete: `src/features/conditional-formatting.js` (empty)
- Delete: `src/utils/compatibility-layer.js` (empty)

## Steps

- [ ] **Step 1: Remove empty files**

```powershell
Remove-Item -LiteralPath "src\enterprise\enterprise-core.js"
Remove-Item -LiteralPath "src\enterprise\enterprise-feature-template.js"
Remove-Item -LiteralPath "src\enterprise\feature-registry.js"
Remove-Item -LiteralPath "src\enterprise\features\breakdown.js"
Remove-Item -LiteralPath "src\features\breakdown.js"
Remove-Item -LiteralPath "src\features\conditional-formatting.js"
Remove-Item -LiteralPath "src\utils\compatibility-layer.js"
```

- [ ] **Step 2: Remove empty directories**

```powershell
Remove-Item -LiteralPath "src\enterprise\features" -Force
Remove-Item -LiteralPath "src\enterprise" -Force
Remove-Item -LiteralPath "src\features" -Force
Remove-Item -LiteralPath "src\utils" -Force
```

- [ ] **Step 3: Verify structure**

```powershell
Get-ChildItem -LiteralPath "src" -Recurse -File | Select-Object -ExpandProperty FullName
```
Expected: only `.ts` files remain, no `enterprise/`, `features/`, or `utils/` directories.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove empty placeholder files (enterprise, features, compat)"
```

## Global Constraints

- No public API breakage
- All 4 build output formats must build: CJS, ESM, UMD, minified UMD
- No dependency version bumps
- No new features
- No CSS/styling changes
- Node >= 18.0.0, D3 peer ^7.0.0
