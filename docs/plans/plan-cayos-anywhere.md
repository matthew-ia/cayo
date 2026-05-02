# Plan: "Cayos Anywhere" Enhancement

Enable `<Cayo component={Some} />` to work with components imported from any location — local files, path aliases, or external npm packages — without requiring them to live in a specific directory. Soft-deprecate `config.components`.

## Background & Motivation

Currently Cayo assumes all Cayo components are local files under `config.components` (`src/components/` by default). The preprocessor strips the import path down to just the filename and stores it in `__cayoPath`; prerender then resolves it with `path.resolve(config.components, src)`. This makes `<Cayo component={Some} />` fail silently when `Some` comes from an external package, because the resolved path points into the local components directory where the file doesn't exist.

## Component ID Design

Component identifiers will use the format `Name_hash` (e.g., `Some_c3b2a1f`):

- **Name**: derived from the filename stem of the full import source (e.g., `my-package/Some.svelte` → `Some`, `my-package/Some.cayo.svelte` → `Some`). Strip the `.svelte` extension (and `.cayo` infix if present). Taken from the import path, not from the variable name the consumer chose, which may vary across files.
- **Hash**: `deterministicHash(fullImportSource)` — a short hex derived from SHA-256 of the full import source string. The same component will always produce the same name across the entire consumer project, enabling bundle reuse rather than one bundle per instance.

This replaces the existing `hash()` in `utils.js`, which uses `crypto.randomBytes` and is non-deterministic.

`data-cayo-src` in final HTML will be `Name_hash` — readable enough for debugging, but safe: no filesystem paths and no package specifiers are ever exposed to the client.

## Steps

### Phase 1: Preprocessor & Utilities

**Step 1** — Capture full import source in preprocessor via markup hook  
Files: `lib/preprocessors/cayo-component.js`, `src/preprocessors/cayo-component.js`

Replace the current `script` hook (regex on `.cayo.svelte` imports) with a single `markup` hook that processes the full file source. The `.cayo.svelte` suffix is no longer required — any `.svelte` import used as a `<Cayo component={...} />` prop is recognized.

Algorithm:
1. Scan the markup for all `<Cayo component={VarName}` usages and collect the set of `VarName`s
2. For each `VarName`, find its `import VarName from 'import/source'` statement in the script block
3. Inject `VarName.__cayoPath = 'import/source';` after each matched import statement

Examples after change:
```js
// External package, plain .svelte (no infix required)
import Some from 'my-package/Some.svelte';
// → Some.__cayoPath = 'my-package/Some.svelte';

// External package with .cayo.svelte (still works)
import Widget from '@scope/pkg/Widget.cayo.svelte';
// → Widget.__cayoPath = '@scope/pkg/Widget.cayo.svelte';

// Local relative
import Counter from './Counter.cayo.svelte';
// → Counter.__cayoPath = './Counter.cayo.svelte';
```

Only imports for bindings actually used as `<Cayo component={...} />` are tagged — unrelated imports are untouched.

**Step 2** — Add `deterministicHash()` and update `generateCayoComponentId()`  
File: `lib/core/utils.js`

New function:
```js
export function deterministicHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 7);
}
```

Updated `generateCayoComponentId(importSource)`:
- Name: extract filename stem from `importSource` (last `/`-delimited segment, strip `.svelte` extension, then strip `.cayo` infix if present)
- ID: `` `${name}_${deterministicHash(importSource)}` ``
- Remove the old `.cayo.svelte` string replacement and the `generateSafeName` path-mangling logic, which was designed around local filenames and breaks on scoped package paths like `@scope/pkg/Component.svelte`

### Phase 2: Module Resolution

**Step 3** — Create `lib/core/resolver.js`

Export a single function:
```js
resolveImportSource(importSource, fromFile, config)
```

Behavior:
- If `importSource` starts with `./` or `../`: resolve with `path.resolve(path.dirname(fromFile), importSource)`
- Otherwise (bare package specifier, scoped package, aliased path): use `@rollup/plugin-node-resolve` to resolve to the absolute filesystem path, using the same Rollup config already present in `bundle.js`
- Cache results keyed by `(importSource, fromFile)` to avoid redundant lookups during a build

This function is build-time only. The resolved absolute path is stored in `_cayo.stats` and used for compilation — it never appears in HTML or client-side code.

### Phase 3: Prerender Overhaul

**Step 4** — Update prerender component discovery  
File: `lib/core/render/prerender.js` (lines 57–95)

Remove:
```js
let absoluteSrc = path.resolve(config.components, src);
```

Replace with:
1. `const { id, name } = generateCayoComponentId(src)` — `name` is now e.g. `Some_c3b2a1f`
2. Overwrite the DOM node immediately: `el.dataset.cayoSrc = name` — replaces the import source with the safe `Name_hash` ID before anything is serialized to disk
3. Resolve to absolute path: `const absoluteSrc = await resolveImportSource(src, page.sourcePath, config)`
4. Store `absoluteSrc` (and `src` as `importSource`) in `_cayo.stats.cayoComponents[name]` — build-time only

Error messages on resolution failure should report `src` (the import source string the user wrote), not a filesystem path.

### Phase 4: Compilation Cleanup

**Step 5** — Clean up `compileCayo`  
File: `lib/core/compile/cayos.js`

Remove:
```js
let filename = filepath.replace(`${config.components}`, '');
```
This is no longer used anywhere after Step 4.

The component `name` is now the `Name_hash` string. The output path `./__cayo/components/${name}.svelte.js` is unchanged — the hash makes a valid, collision-safe filename.

Update the error message in `compileCayos` to reference the `importSource` stored on the stat object rather than stripping `config.projectRoot` from the filesystem path.

### Phase 5: Deprecate `config.components`

**Step 6** — Soft-deprecate in config  
File: `lib/core/config.js`

- Keep normalizing and storing `config.components` so old projects don't throw on startup
- Remove `components` from the `pathsToCheck` validation in `handlePaths` — don't error if the directory doesn't exist
- Add a code comment above the `components` line:
  ```js
  // Deprecated: config.components is no longer used by the build pipeline.
  // Kept for backward compatibility — the configured value is ignored.
  ```
- No runtime warning is emitted; deprecation is communicated via README only

**Step 7** — Remove `config.components` usage from pipeline  
Files: `lib/core/render/prerender.js` (done in Step 4), `lib/core/compile/cayos.js` (done in Step 5), `lib/cli/watch.js`

- `watch.js` line 32: `filepath = filepath.replace(config.components, '')` — replace with a display path derived from `config.projectRoot` instead
- `watch.js` line 58: the `.cayo.` infix branch routes to `handleCayo`, which calls the same `handleOther` as `handleComponent`. With no infix convention, local Cayo files fall through to `handleComponent` — behavior is identical. Keep the branch only if the distinct log message ("cayo updated" vs "component updated") is desired; otherwise it can be removed.

**Step 8** — Update docs  
Files: `docs/config-reference.md`, `README.md`

- Remove the `components` option from `docs/config-reference.md`
- In `README.md`, update the following:
  - **Config section**: mark `components` as deprecated and no longer functional
  - **Project structure example** (line 57): `some.cayo.svelte` — note that the `.cayo` infix is optional, any `.svelte` file works
  - **Cayo component convention** (line 303): remove the requirement to include `.cayo` in the filename; reframe it as optional/conventional rather than required
  - **`component` prop usage examples** (lines 281, 317, 374): update to show both a `.cayo.svelte` example and a plain `.svelte` example; clarify that the infix is no longer needed
  - **`src` prop description** (line 341): remove the statement that `src` must be relative to the components directory — it is now a full import source path (relative or package specifier); update the nested example accordingly
  - **Slot / prerender example** (line 516): no filename change needed, but review surrounding prose for any "must be in components directory" language

## Relevant Files

| File | Step | Change |
|---|---|---|
| `lib/preprocessors/cayo-component.js` | 1 | Replace `script` hook with `markup` hook; tag any `.svelte` import used as a Cayo prop |
| `src/preprocessors/cayo-component.js` | 1 | Same change (source copy) |
| `lib/core/utils.js` | 2 | Add `deterministicHash()`, update `generateCayoComponentId()` |
| `lib/core/resolver.js` *(new)* | 3 | `resolveImportSource()` — build-time module resolution |
| `lib/core/render/prerender.js` | 4 | Use resolver; overwrite `data-cayo-src` with `Name_hash` |
| `lib/core/compile/cayos.js` | 5 | Remove path stripping; improve error messages |
| `lib/core/config.js` | 6 | Deprecate `config.components`; remove from path validation |
| `lib/cli/watch.js` | 7 | Remove `config.components` path stripping (line 32) |
| `docs/config-reference.md` | 8 | Remove `components` entry |
| `README.md` | 8 | Deprecate `components` config; update `.cayo.svelte` convention prose and all usage examples to reflect `.cayo` infix being optional |

## Verification

Note: verification testing will be done manually by a human. Do not write any tests for this.

1. Create a local test package with a plain `Some.svelte` component (no `.cayo` infix); `npm link` it into a test consumer project
2. In consumer: `import { Some } from 'my-package'` → `<Cayo component={Some} />` — verify it renders and hydrates in both dev and build modes
2a. Repeat with a `.cayo.svelte` suffixed export to confirm both conventions work
3. Inspect final HTML: `data-cayo-src` value is `Some_c3b2a1f` — no package name, no path
4. Use the same component twice on the same page and on different pages — verify only one bundle is emitted (bundle reuse via deterministic name)
5. Test scoped package: `import { Widget } from '@scope/my-package'`
6. Verify existing local `.cayo.svelte` components work without any changes to consumer code
7. Verify a project with `config.components` set still starts without error (backward compat)
8. Watch mode: verify `watch.js` display path change doesn't break watcher output

## Decisions

- `data-cayo-src` in HTML = `Name_hash` — readable but safe; no path or package info exposed to the client
- Name is derived from the import path filename stem (deterministic), not the consumer's local variable name
- `config.components` is kept in config loading but the value is "thrown away" — not used in any resolution logic; deprecated via comment and README only
- No `.cayo.svelte` suffix required — any `.svelte` component used as a `<Cayo component={...} />` prop is recognized via the markup hook
- External package file changes do not trigger dev auto-reload (documented limitation)

## Out of Scope

- TypeScript `paths` aliases (may already work via Rollup resolver; to be confirmed separately)
- Auto-reload on external package changes
