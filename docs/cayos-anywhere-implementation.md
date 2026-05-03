# Cayos Anywhere — Implementation Notes

## What it is

"Cayos Anywhere" allows `<Cayo component={X} />` to work with components imported from any location: local files, path aliases (e.g. `$components/Counter.svelte`), or external npm packages (e.g. `@scope/pkg/Widget.svelte`). Previously, cayo components had to live under `config.components` and were referenced only by filename.

---

## How it works end-to-end

### 1. Svelte preprocessor (`src/preprocessors/cayo-component.js`)

At compile time, the preprocessor scans each page's markup for `<Cayo component={VarName} />` usages, then finds the corresponding `import` statement and injects `VarName.__cayoPath = '...';` after it.

For **default imports**, `__cayoPath` is a plain string:
- Relative: the absolute resolved path (e.g. `/abs/path/Counter.svelte`)
- Package/alias: the raw specifier as written (e.g. `$components/Counter.svelte` or `@scope/pkg/Widget.svelte`)

For **named imports** (`import { Counter } from 'some-pkg'`), `__cayoPath` is a JSON string:
```js
Counter.__cayoPath = '{"from":"some-pkg","named":"Counter"}';
```

### 2. `<Cayo>` component (`src/cayo.svelte`)

Reads `component.__cayoPath` and writes it verbatim into `data-cayo-src` on the placeholder element. JSON strings are passed through as-is.

### 3. Prerender (`lib/core/render/prerender.js`)

For each `[data-cayo-src]` element found in the prerendered HTML:
- If the value is valid JSON with a `from` field → it's a named import; resolve `from` and store `named`
- Otherwise → it's a plain specifier; call `resolveImportSource`, falling back to `path.resolve(config.components, src)` only if resolution throws (legacy `src=` prop support)

### 4. Import resolution (`lib/core/resolver.js`)

`resolveImportSource` tries, in order:
1. If already absolute → use as-is
2. If relative (`./`, `../`) → `path.resolve` from the importing file
3. Otherwise → iterate `config.vite.rollupOptions.plugins` and call each plugin's `resolveId(importSource, fromFile, {})` with a minimal fake context (`{ resolve: async () => null }`). First non-null result wins.
4. If no plugin resolves it → `createRequire(fromFile).resolve(importSource)` (handles bare npm packages)
5. If that throws → throw, which triggers the `config.components` fallback in prerender

### 5. Cayo compilation (`lib/core/compile/cayos.js`)

For named imports, a synthetic entry file is written to a temp path:
```js
import { Counter } from 'some-pkg';
export default Counter;
```
This is passed to Rollup so it can resolve the package natively, bundle the component, and produce a correct default export.

---

## Known fragility / shortcomings

### Plugin `resolveId` fake context
We call each Rollup plugin's `resolveId` with `{ resolve: async () => null }` as `this`. The `@rollup/plugin-alias` works because when its internal `this.resolve()` returns null it falls back to returning the substituted id directly. Any plugin that:
- calls other `this` methods (e.g. `this.warn`, `this.error`, `this.getModuleInfo`) will throw, get silently caught, and be skipped
- requires a successful `this.resolve()` result to produce its output will silently fall through

### Only reads `rollupOptions.plugins`
`resolveImportSource` and the former `isExplicitImportSource` only look at `config.vite.rollupOptions.plugins`. Alias plugins placed in `config.vite.plugins` (Vite-only) are not consulted. Convention: alias plugins intended to affect cayo resolution must be in `rollupOptions.plugins`.

### Relative alias replacements
If a user writes `{ find: '$foo', replacement: './relative/path' }` instead of using `path.resolve(...)`, the alias plugin returns a non-absolute path and downstream resolution will break. All alias replacements should be absolute paths.

### Silent fallback to `config.components`
When `resolveImportSource` throws for any reason, prerender silently falls back to `path.resolve(config.components, src)`. For new-style `component={X}` usage this will almost always produce a wrong path — but the error message ("path does not exist") may be confusing because it won't mention the original specifier.

### Named import: component must be a Svelte component
The synthetic entry file approach works only when the named export is itself a Svelte component. If a barrel exports a plain object or a non-component value, Rollup will compile it without error but the runtime mount will silently fail.
