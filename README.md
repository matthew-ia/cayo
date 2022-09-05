# Cayo

> Pronounced [ka-yo], meaning _small island_ :desert_island:

A static HTML generator for the small stuff. With islands of reactivity. Powered by Svelte and Vite. 

## Why Cayo?
The main purpose of Cayo is to be a tool that lets you use modern front-end tooling (Svelte, Vite, file-based routing) to generate static HTML output, and having the option to use Svelte components that are reactive on the client.

**Cayo prerenders your pages to HTML**. It enables the use of Svelte as a templating language for generating static content. Cayo doesn't have opinions about what your output should be, just that it's HTML. You can think of Cayo's primary function as being a Svelte-to-HTML generator.

**Cayo lets you define where you _do_ want reactivity, with Cayo Components**. If you want the Svelte reactivity, you can have it, with Cayo Components (or "cayos" a.k.a. the "islands of reactivity"). These are components that are individually bundled and will be mounted and run as a Svelte client-side component.

**Cayo is built for that person who has constraints on their output**—someone who needs control over their HTML generation workflow, and wants to use tools like Svelte and Vite. All while not having to buy into the typical use of creating an _entire website_, as frameworks are typically designed to be used.

**Cayo is not a feature-rich web app framework** like Astro or SvelteKit. Read more about [how Cayo differs](#cayo-&-the-rest) from similar tools.

## Getting Started

The easiest way to get started is by using the default cayo template. You can use [degit](https://github.com/Rich-Harris/degit) to create a new cayo project with that template:

```zsh
# Create new project
npx degit matthew-ia/cayo/template ./my-project

# Go into the new project and install npm packages
cd my-project
npm i
```

To run (develop) your project:
```zsh
cayo dev
```

To build your project:
```zsh
cayo build
```

You can also take a look at the template before copying it—it's in this repo in [./template](./template/).

## Project Structure

These folders will be present in your project if you use the template. By default, if your project doesn't have this structure it will not run. However, all of these directories and more can the can be customized with [configuration options](docs/config-reference.md).

**Example**
```
src/
├ pages/
│ └ index.svelte
├ components/
│ └ some.cayo.svelte
├  __template.svelte
└  entry.js
public/
├ image.png
├ favicon.ico
└ p5.min.js
```

### Source Directory
Most of your projects files should go in `src`. This is where pages, components, styles, etc. should go. These files will be watched while running `cayo dev`, and used to build your project.
- `pages` contains the pages, or "inputs" of your project (they don't have to be a true page)
- `components` contains your Cayo Components, and can contain any other components
- `__template.svelte` is your page template 

### Pages
Cayo uses a file-based routing system, meaning the file structure within the pages directory gets used to generate output files in the right structure. All pages are expected to be valid Svelte components. Since your outputs just become regular-old HTML files, there is no real "routing" going on here beyond the expected default of HTML files being served on a web server. Pages, or outputs, will be served at the path based on their name and directory structure within the pages directory. Cayo will expect all files with the `.svelte` extension in the pages directory to be a page. 

#### Index Page
A file named `index.svelte` at the root of the pages directory will map to `index.html` as expected, and be served at the root of as expected (`/`, `host/`).

#### Nested Pages
A nested page will be served at a nested URL based on it's own path, relative to the pages directory. In the output, every page other than `pages/index.svelte` gets mapped to an `index.html` in a relatively named directory. For example,  `nested/page.svelte` gets mapped to `<outDir>/nested/page/index.html`.

A "portfolio site" example:
1. Given a page named `pages/projects/project-1.svelte` 
2. The page will be mapped to `<outDir>/projects/project-1/index.html` 
3. Which would be served at `/projects/project-1`

Because Cayo just uses each page's path to construct the output structure, you can also have nested index pages as expected:
1. Given a page named `pages/projects/index.svelte`
2. The page will be mapped to `<outDir>/projects/index.html`
3. Which would be served at `/projects`

This allows you to configure your site structure without needing to worry about defining routes programmatically, like you might do when using Svelte without SvelteKit. 

To expand upon the portfolio example, your pages directory could look like this, and would be served at the expected routes:
```
pages
├ projects
│ ├ index.svelte      # /projects 
│ ├ project-1.svelte  # /projects/project-1
│ └ project-2.svelte  # /projects/project-2
└ index.svelte        # / (home)
```

### Template File
This is file is required and used to render all of your pages. The output will match this file's markup, but replace the cayo placeholders with their respective markup. 

This file is a Svelte component, so you can also import other Svelte components or use rendering logic. For example, to render certain markup as output based the mode `development` vs. `production` (i.e., `cayo dev` vs. `cayo build`).

> **Note:** 
> Despite being a Svelte component, the Template file does not support the `<slot>` element, because it is prerendered by itself before it is used to prerender page components. The placeholder `%cayo.body%` replaces the usage for `<slot>` in a template file.

Template files support the following placeholders:

- `%cayo.body%` – the content of a page. Think of this as the `<slot>` of the Template Svelte component

- `%cayo.script%` – where your [entry script](#entries) (JS) for a page will be imported. This is needed if a page is to render a Cayo Component, but otherwise is optional

- `%cayo.css%` – where CSS will be injected (as `<link src="style.css">` or `<style>...</style>` depending on your [CSS config option](docs/config-reference.md#cssinternal))

- `%cayo.title%` – if you're using Cayo to [define dynamic page titles](), this is required. Otherwise you can define page titles with [`<svelte:head>`](https://svelte.dev/docs#template-syntax-svelte-head)

- `%cayo.head%` – `<link>` and `<script>` elements needed by a page, plus any `<svelte:head>` content

#### Example
Technically all of these placeholders are optional, and don't have to be in any particular place.

```svelte
<!-- src/__template.svelte -->
<!DOCTYPE html>
<html>
  <head>
    %cayo.head%
    %cayo.title%
    %cayo.css%    
  </head>
  <body>
    %cayo.body%
    %cayo.script%
  </body>
</html>
```

Your template doesn't even have to be a valid HTML document—your output could be HTML fragments. This is also a valid template file:

```html
<!-- src/__template.svelte -->
<!-- No html, head, or body elements... and that's okay! -->
%cayo.script%
%cayo.css%
%cayo.body%
```

## Config

Cayo projects don't require a config file, but if you want to customize your setup, you can do so by creating a `cayo.config.js` file at your project's root.

```js
// cayo.config.js
export default {
  // config options
}
```

For all options, read the [Configuration Reference](docs/config-reference.md).

### Plugins & Preprocessors
You can extend Cayo with Vite plugins, Rollup plugins, or Svelte preprocessors, but configuring those options in the Cayo config. 

By default, Cayo already internally uses a few plugins & preprocessors:
- Svelte preprocessors
  - [`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess) – _one preprocessor to rule them all_. But really, this enables support for things like Sass, PostCSS, Pug, etc., all with zero config, right in your Svelte files. 
- Rollup plugins
  - [`rollup-plugin-svelte`](https://github.com/sveltejs/rollup-plugin-svelte) – official plugin for Svelte
  - [`rollup-plugin-import-css`](https://github.com/jleeson/rollup-plugin-import-css) – adds support for `import 'style.css' in JS source files
  - [`@rollup/plugin-json`](https://github.com/rollup/plugins/tree/master/packages/json) – adds support for `import data from 'data.json'` in JS source files

If you need to add _plugin/preprocessor options_ to any of these, you'll need to install them in your project and pass them as config options in `cayo.config.js`.

Vite options will only be used during `cayo dev` for the Vite Server, and for `cayo build` (which is a specially configured run of Vite's build process).

## Cayo Components

Cayo Components, or Cayos, are Svelte components that are bundled into client friendly JS, and mount to the output HTML during client runtime. These work like having contained Svelte apps within your page, rather than your whole page being a Svelte app. 

Cayos are an opt-in feature, thus they require a few things:
- to be rendered by _the_ `<Cayo>` component
  - this is an export of the cayo package, which you will need to import: `import Cayo from 'cayo/component'`
- to include the `.cayo` infix (e.g., `some.cayo.svelte`).

### How Cayos Work
Assuming your project directory looks something like this:
```
src/ 
├ components/
│ └ counter.cayo.svelte
├ pages/
│ └ index.svelte
└ __template.svelte
```

And `counter.cayo.svelte` has some reactive code you want to run on the client:
```svelte
<!-- src/components/counter.cayo.svelte -->
<script>
  export let count = 0;
</script>

<div>
  The count is: {count}
</div>
<button on:click={() => count++}>Increment</button>
```

And `page.svelte` "registers" that Cayo component, like so:
```svelte
<!-- src/pages/page.svelte -->
<script>
  import Cayo from 'cayo/component';
</script>
<!-- Say you want to start the count as 1 instead of 0, you can pass that value as a prop -->
<Cayo src="counter.cayo.svelte" count={1}/>
<!-- This looks kinda weird, but is valid Svelte code -->
<slot name="entry">
  <script src="index.js" data-cayo-entry />
</slot>
```

The resulting output will be a placeholder for the component. By default, this placeholder be used as the target for that Svelte component to mount to:
```html
<!-- .planter/index.html -->

<!-- props are stringified, to be used during component hydration -->
<!-- Cayo IDs are unique to every instance of that Cayo -->
<div data-cayo-id="counter-<UUID>" data-cayo-props="{ count: 1 }"></div>
```

Cayo uses the [Svelte Client-side component API](https://svelte.dev/docs#run-time-client-side-component-api) to then hydrate these components at runtime. All registered Cayos will have their hydration code dynamically built in a file called `cayo-runtime.js` which will be placed at the root of every input (page) directory, in the output. The code in `cayo-runtime.js` is what will actually mount the 

### Props

A Cayo can receive props that will be used during hydration. However, all props must be serializable, as the props are stringified during build time and parsed during runtime.

Props that will work without issue:
- Strings
- Arrays
- Objects (e.g., `{ key: 'value' }`, but again, no non-serializable values within)

Common types that are non-serializable are:
- functions
- Sets
- Maps

If you need non-serializable props, like a function, consider defining them in an [entry](#entries), or refactoring the logic to be within the Cayo itself. 

## Entries

An entry serves two purposes: 
1. to be a specific page's JS (like the `main.js` to an `index.html`)
2. to let you define when and where Cayos are to be rendered

Since not every page will necessarily need Cayos, including an entry file at all is optional. You can define different entry files per page, or use the same one for all of them. 

An example of an entry that will render Cayos:
```js
// src/index.js

// When you want to render cayos
renderCayos()
```

The glaring question is: "where does `renderCayos` come from? It's not imported in the file?"

Cayo generates a file for the client called `cayo-runtime.js`. This file has a default export that corresponds to `renderCayos`. Cayo prepends `import renderCayos from 'cayo-runtime.js'` when it processes your entry files for output. It will only prepend the `renderCayos` import at the head of your entry if there are Cayos registered on the page that is using that entry.

To use an entry file in a page:
```svelte
<!-- src/pages/page.svelte -->

<!-- ...other page stuff -->
<!-- This looks kinda weird, but is valid Svelte code, and is how you assign an entry file to a page -->
<slot name="entry">
  <script src="index.js" data-cayo-entry />
</slot>

```
**A few notes on the markup here:**

- wrapping it in a `<slot>` is required
    - this is because Svelte only allows one `<script>` at the root of a component
    - the `<slot>` doesn't need to be named, it's just for readability here. But if you need to use `<slot>` normally in your page, you do need to make this a named slot (named anything, like "entry"). 
- the attribute `data-cayo-entry` is required, and is the actual indicator that this script should be used as the entry.
- the `src` attribute should point at JS file that is **relative to the [`src` directory](#source-directory)**, rather than relative to the page itself

### `renderCayos`

The code in `cayo-runtime.js` that is generated looks like:
```js
// cayo-runtime.js
export default renderCayos(cb) {
  var target = cb ? cb : (node) => node;
  let cayos = {};
  // Code that adds cayo instances to the `cayos` object
  // Example, based on counter.cayo.svelte from earlier
  // 'counter-f00b4r' is a generated unique identifier for the instance
  cayos['counter-f00b4r'] = {};
  cayos['counter-f00b4r'].target = document.querySelector('[data-cayo-id="counter-f00b4r"]');
  cayos['counter-f00b4r'].instance = new ${componentName}({
    target: target(cayos['counter-f00b4r'].target),
    hydrate: true,
    props: getProps(cayos['counter-f00b4r'].target),
  });

  return cayos;
}
```

`renderCayos()` returns a object with all of the cayo instances. Each keyed object within it looks like the following:
```js
{
  cayoId: {
    target: // the target node for the instance
    instance: // the Svelte component instance object
  }
}
```

`renderCayos()` takes one argument: `cb`, which is a callback that should returns the node to mount the component to—the target node. By default, the placeholder will be the target node, so the component will be mounted as child of `<div data-cayo-id="...">`. If you wanted to wrap it in a custom placeholder, you could do so by passing that logic as the callback. 

`cb` should be a function that matches this signature:
```js
/**
 * Callback for renderCayos
 * 
 * @param {HTMLElement} node the placeholder node (the cayo instance placeholder <div>)
 * @return {HTMLElement} the target node
 */
function cb(node) {
  // do something with placeholder node
  // or, create a new element to use as a node
  // or, use a different node that exists on the page
  // ...whatever you want!

  // finally, return whatever node you want to use as the target
}
```

A Cayo will always be rendered as a child of whatever the target node is, per [Svelte's Client-side component API](https://svelte.dev/docs#run-time-client-side-component-api).

For example:
```js
// src/index.js

// "Where" you want to render cayos
function customPlaceholder(node) {
  const placeholder = document.createElement('span');
  node.innerHTML = '';
  return node;
}
// "When" you want to render cayos
renderCayos(customPlaceholder);
```

#### Another Example

Say you want to render something in a Cayo before it gets hydrated, like a "loading" indicator. Using the same component from earlier, `counter.cayo.svelte`:

```svelte
<!-- src/pages/page.svelte -->
<script>
  import Cayo from 'cayo/component';
</script>
<Cayo src="counter.cayo.svelte">
  <!-- This will render inside the placeholder because the <Cayo> component renders a <slot> -->
  Loading counter...
</Cayo>
<slot name="entry">
  <script src="index.js" data-cayo-entry />
</slot>
```

```js
// src/index.js

// "Where" you want to render cayos
// Also, do something to the target node before the component is mounted
function replaceContents(node) {
  node.innerHTML = '';
  return node;
}
// "When" you want to render cayos
renderCayos(replaceContents);
```

**Note:** `getProps()` is also generated in `cayo-runtime.js`. It handles parsing the props as a string, to use the props to hydrate the Cayo instance.

## Styles

Since Vite has some [built-in CSS features](https://vitejs.dev/guide/features.html#css), things Sass and CSS Modules just work! Otherwise, [Svelte's component-scoped styles](https://svelte.dev/docs#component-format-style) is likely the best way to write styles while using Svelte. With the `svelte-preprocess` Svelte custom preprocessor, you get Sass and PostCSS support right in your Svelte files:

```svelte
<div class="sassy">I'm some <span>sassy</span> markup.</div>
<!-- Use lang="scss" to indicate the style block should be preprocessed with Sass -->
<style lang="scss">
  $color: fuchsia;
  .sassy {
    color: $color;
    span {
      font-weight: bold;
    }
  }
</style>
```

If you want to define global styles external to your Svelte files, you can do so the "Vite way", by importing the stylesheet into a page's entry file. Assuming you have a Sass file with all of your global styles: `src/styles/global.scss`.
Entry:
```js
// src/index.js
import 'styles/global.scss';
// ...other entry stuff
```
Page:
```svelte
<!-- src/pages/page.svelte -->

<!-- ...other page stuff -->
<slot name="entry">
  <script src="index.js" data-cayo-entry />
</slot>


## Cayo & the Rest

**Cayo** is a static HTML generator, with islands of reactivity, file-based routing, and the power of Svelte & Vite. Cayo _is_ niche, and it's kinda meant to be! I built it for my use case, but intentionally made it configurable (and chose tools with good plugin ecosystems), so hopefully at least a few folks with similar needs can make use of it. Cayo borrows certain structural patterns from SvelteKit, some concepts like "island architecture" from Astro, and is powered by Svelte and Vite (and under the hood, Rollup too, independently of Vite). 

**These other tools are _probably_ what you're looking for. It's recommended to look into these first. (But, if you have constraints they can't support, Cayo might be of help!)**

**Astro** is a web framework for building fast, content-focused websites. Astro is the most similar to Cayo (in concept), and I recommend trying it out first before using Cayo.

**SvelteKit** is a framework for building web applications of all sizes, with a beautiful development experience and flexible filesystem-based routing. Also has the power of Svelte & Vite.

**ElderJS** is an opinionated static site generator and web framework built with SEO in mind. The origin story of ElderJS is quite similar to Cayo's: a developer needed something tailored to their use case, so they decided to make it themselves. ElderJS includes a lot of cool features like "build hooks", and is also zero-JS first!

## Contributions

Since Cayo was built and designed specifically for a use case at my place of work, it probably won't be actively maintained nor will it take pull requests unless they fix bugs or generally expand upon it's configurability. Forking and building upon Cayo for your own use is heavily encouraged!
