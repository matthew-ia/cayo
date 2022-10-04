# Cayo :desert_island:

> Pronounced [ka-yo], meaning _small island_

A static HTML generator for the small stuff, with islands of reactivity. Powered by Svelte & Vite. 

## Why Cayo?
The main purpose of Cayo is to be a tool that lets you use modern front-end tooling (Svelte, Vite, file-based routing) to generate static HTML output, and have the option of using Svelte components that are reactive on the client.

- **[Cayo prerenders](#components) your pages to HTML**. Essentially, it enables the use of Svelte for generating static content as if it's a templating language. You can think of Cayo's primary function as being a Svelte-to-HTML generator.

- **Cayo lets you define where you _do_ want reactivity, with [Cayo Components](#cayo-components)**. If you want Svelte reactivity, you can have it—with Cayo Components (or "cayos" a.k.a. the "islands of reactivity"). These are components that are individually bundled and run as Svelte client-side components.

- **Cayo is built for that person who has constraints on their output**—someone who needs control over their HTML generation workflow, and wants to use tools like [Svelte](https://svelte.dev) and [Vite](https://vitejs.dev). All while not having to buy into the typical use case of creating an _entire website_, as frameworks are typically designed to be used.

- **Cayo is _not_ a feature-rich web app framework** like Astro or SvelteKit. Read more about [how Cayo differs](#cayo--the-rest) from similar tools.

## Getting Started

The easiest way to get started is by using the default cayo template. You can use [degit](https://github.com/Rich-Harris/degit) to create a new cayo project with that template:

```zsh
npx degit matthew-ia/cayo/template ./my-project
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

You can also add Cayo to an existing project. It is recommended that you take a look at the [project structure docs](#project-structure) and the [template](./template/), as there is a required project structure for a Cayo project. 

Install `cayo`:
```zsh
npm i -D cayo
```

## Project Structure

These folders will be present in your project if you use the template. By default, if your project doesn't have this directory structure, `cayo` will not successfully run. However, all of these directories can be customized with [configuration options](docs/config-reference.md).

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
Most of your project files, such as pages, cayos, styles, etc. should go in `src`.
- `pages` contains the pages, or "inputs" of your project 
- `components` contains your Cayo Components, and can contain any other components
- `__template.svelte` is your page template

Note: `cayo` watches and builds from the project root, but certain paths are expected as relative to the source directory rather than the root, e.g., cayos and pages. Read the config reference for more information.

### Pages
Cayo uses a file-based routing system, meaning the file structure within the pages directory gets used to generate output files. All pages are expected to be valid Svelte components. Since your outputs just become regular old HTML files, there is no real "routing" going on here beyond the expected default of HTML files being served on a web server. 

Pages, or outputs, will be served at the path based on their name and directory structure within the pages directory. Cayo will expect all files with the `.svelte` extension in the pages directory to be a page.

For example, `page.svelte` will be served at `/page`:
```shell
pages/
├ about.svelte  # /about
└ page.svelte   # /page
```

#### Links
To link to a page, just use the expected URL path:
```html
<a href="/page">Link to Page</a>
```

This works because, in the output, every page gets mapped to an `index.html` in a respectively named directory.  For example,  `pages/page.svelte` gets mapped to `<outDir>/page/index.html`.

#### Index Page
A file named `index.svelte` at the root of the pages directory will map to `<outDir>/index.html` and be served at the root (`/`).

```shell
pages/
└ index.svelte  # /
```

#### Nested Pages
A nested page will be served at a nested URL based on it's own path, relative to the pages directory.

A "portfolio site" example:
1. Given a page named `pages/projects/project-1.svelte` 
2. The page will be mapped to `<outDir>/projects/project-1/index.html` 
3. Which would be served at `/projects/project-1`

<!-- TODO: support nested index pages 
Cayo _also_ allows you to explicitly define nested index pages:
1. Given a page named `pages/projects/index.svelte`
2. The page will be mapped to `<outDir>/projects/index.html`
3. Which would be served at `/projects`
-->

This allows you to configure your site structure without needing to worry about defining routes programmatically, which you might need to do if you were using Svelte without Cayo or another tool like SvelteKit.

To expand upon the portfolio example, your pages directory could look like this, and would be served at the expected routes:
```shell
pages/
├ projects/
│ ├ project-1.svelte  # /projects/project-1
│ └ project-2.svelte  # /projects/project-2
└ index.svelte        # / (home)
```

#### What about nested index pages?
Nested index pages are not supported by Cayo in the same way `pages/index.svelte` works. However, you can still define nested index pages via the normal file-based routing expectations. For example:
```shell
pages/
├ projects/
│ ├ project-1.svelte  # /projects/project-1
│ └ project-2.svelte  # /projects/project-2
├ projects.svelte     # /projects
└ index.svelte        # / (home)
```

In this example, `projects.svelte` will be mapped to `<outDir>/projects/index.html`, which is served at `/projects` (so, by default, it's effectively the index for that route).

### Template File
The Template file is required, and used to render all of your pages. The output will match this file's markup, but replace the cayo placeholders with the respective markup for each page. Your template file should be at root of the `src` directory, and be named `__template.svelte`. You can change the expected name with [with the config](docs/config-reference.md#templateName).

This file is a Svelte component, so you can also import other Svelte components or add rendering logic. For example, you could render different markup wrapping your pages depending on the environment mode like `'development'` or `'production'` (see [config example](docs//config-reference.md#conditional-config)).

> **Note**<br>
> Despite being a Svelte component, the Template file does not support the `<slot>` element, because it itself is prerendered _before_ it is used to prerender page components. The placeholder `%cayo.body%` replaces the basic usage for `<slot>`.

Template files support the following placeholders:

- `%cayo.body%` – the content of a page. Think of this as the `<slot>` of the Template Svelte component

- `%cayo.script%` – where your [entry](#entries) for a page will be imported. This is needed if a page is to render a Cayo Component, but is otherwise optional

- `%cayo.css%` – where CSS will be added (as `<link src="style.css">` or `<style>...</style>` depending on your [CSS config option](docs/config-reference.md#cssinternal))

- `%cayo.title%` – add a default title to the page only if one is not already set on a specific page (via [`<svelte:head>`](https://svelte.dev/docs#template-syntax-svelte-head) or other some other method). The default title will be generated using the page's filename (e.g., `page.svelte` will have the title `Page`). This placeholder is optional

- `%cayo.head%` – `<link>` and `<script>` elements needed by a page, plus any `<svelte:head>` content

#### Example
Technically all of the placeholders are optional, and don't have to be in any particular place within your markup.

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

Your template doesn't even need to be a valid HTML document—you could be outputting HTML fragments! This is also a valid template file:

```html
<!-- src/__template.svelte -->
<!-- No html, head, or body elements... and that's okay! -->
<div>something I want on every page</div>
%cayo.script%
%cayo.css%
%cayo.body%
```

### .cayo

Once you run your project, you'll see directory named `.cayo` in your project's root. This directory is used for Cayo's internal output. Its contents are served during `cayo dev`, and used to build your project during `cayo build`. 

This directory can be deleted at any time. Every time you run `cayo dev` or `cayo build` it will be recreated and updated as needed.

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
You can extend Cayo with Vite plugins, Rollup plugins, and Svelte preprocessors, by configuring respective options in the Cayo config. 

By default, Cayo internally uses a few plugins & preprocessors:
- Svelte Preprocessors
  - [`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess) – _one preprocessor to rule them all_. This enables support for things like Sass, PostCSS, Pug, etc., all with zero config, right in your Svelte files. 
- Rollup Plugins
  - [`rollup-plugin-svelte`](https://github.com/sveltejs/rollup-plugin-svelte) – official plugin for Svelte
  - [`rollup-plugin-import-css`](https://github.com/jleeson/rollup-plugin-import-css) – adds support for `import 'style.css'` in JS source files
  - [`@rollup/plugin-json`](https://github.com/rollup/plugins/tree/master/packages/json) – adds support for `import data from 'data.json'` in JS source files

If you need to add _plugin/preprocessor options_ to these, you'll need to install the necessary packages locally, and import and use them as config options in `cayo.config.js`.

More on [Svelte options](docs/config-reference.md#svelte-options), [Vite options](docs/config-reference.md#vite-options), and [Rollup options](docs/config-reference.md#rollup-options) in the [Configuration Reference](docs/config-reference.md).

> **Warning**<br>
> Vite plugins will be passed to Cayo, but it's possible that certain plugins may break Cayo if they deal with handling the input differently than vanilla Vite or generate additional output files. Cayo acts like a plugin itself, by handling your source files and transforming them into files that vanilla Vite expects (e.g., the built-in "file-based router" is similar to Vite multi-page plugins).

## Components

By default, all components are prerendered. This means their lifecycle ends after they finish one run cycle, and the UI state after the first cycle is rendered to static HTML. This also means that any JS you use within the component's `<script>` element "compiles away" after it's used to render the component. These components are essentially "server side rendered", but are done so locally within Cayo processes rather than on a production server.

Because the JS doesn't get taken to the client, this allows you to use any JS you want in order to render content, even Node built-in packages, like `path` or `fs`, and access global Node variables like `process`. This can be helpful if you want to extend rendering conditions that are specific to your own project's setup or workflow.

But, what if you _do_ want runtime reactivity within a component? Enter, Cayo Components.

## Cayo Components

Cayo Components, or Cayos, are Svelte components that are bundled into client-friendly JavaScript, and mount to the output HTML during client runtime. These work like having contained Svelte apps within your page, rather than your whole page being a Svelte app. 

Cayos require a few things. You must:
- _Register_ them by using the `<Cayo>` component
  - You will need to import from the `cayo` package: `import { Cayo } from 'cayo'`
- Include the `.cayo` infix in your Cayo's filename (e.g., `some.cayo.svelte`)
- Use the [Render Hook](#render-hook) in an [entry](#entries) to render them on a page during runtime

The `<Cayo>` component doesn't actually render your Cayos—instead it creates _placeholders_ for them, which are used by the Render Hook to mount them to the page.

### Basic Usage

Let's assume the component `components/counter.cayo.svelte` exists in your project, and has a prop `count`:
```svelte
<!-- Register your Cayo with the <Cayo> component -->
<script>
  import { Cayo } from 'cayo';
</script>
<!-- Basic usage -->
<Cayo src="counter.cayo.svelte" />
<!-- Any additional props will be used to hydrate the Cayo on the client -->
<Cayo src="counter.cayo.svelte" count={1} />
```

The `src` prop is the only required prop, and is used to identify which Cayo Component should be rendered later. The value of `src` needs to be the path of a Cayo, but must be relative to the components directory (e.g., `src/components` by default). For example, say your Cayo was `components/nested/counter.cayo.svelte`, your usage would need to change to `<Cayo src="nested/counter.cayo.svelte" />`.

The `<Cayo>` component can be rendered on a page or any other Svelte component except other Cayos.

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

And `page.svelte` registers that Cayo component, like so:
```svelte
<!-- src/pages/page.svelte -->
<script>
  import { Cayo, Entry } from 'cayo';
</script>
<!-- Say you want to start the count as 1 instead of 0, you can pass that value as a prop -->
<Cayo src="counter.cayo.svelte" count={1} />
<!-- Declare the entry -->
<Entry src="entry.js" />
```

The resulting output will be a placeholder for the component. By default, this placeholder is used as the target for that Svelte component to mount to:
```html
<!-- .planter/index.html -->

<!-- props are stringified, to be used during component hydration -->
<!-- Cayo IDs are unique to every instance of that Cayo -->
<div data-cayo-id="counter-<UUID>" data-cayo-props="{count:1}"></div>
```

Cayo uses the [Svelte Client-side component API](https://svelte.dev/docs#run-time-client-side-component-api) to then hydrate these components at runtime. All registered Cayos will have their hydration code dynamically generated in a file called `cayo-runtime.js`. Each input (page) will have it's own `cayo-runtime.js` file in the output. The code in `cayo-runtime.js` includes the logic that will mount and hydrate these components. 

[Entries](#entries) are where you will actually make use of this generated cayo runtime code. 

### Props

A Cayo can receive props that will be used during hydration. However, all props must be serializable, as the props are stringified during build time and parsed during runtime.

Props that will work without issue:
- Strings
- Arrays
- Objects (e.g., `{ key: 'value' }`, but again, no non-serializable values within)

Common types that are non-serializable are:
- Functions
- Sets
- Maps

If you need non-serializable props, like a function, consider refactoring it to not be a prop, but initialized in an [entry](#entries), or refactoring the logic to be within the Cayo itself. 

## Entries

An entry serves two purposes: 
1. Be the main JavaScript file for a page
2. Let you define when and where Cayos are to be rendered

Since not every page will necessarily need Cayos, including an entry file at all is optional. You can define different entries per page, or even use the same file for all pages.

Adding an entry to a page:
```svelte
<!-- src/pages/page.svelte -->
<script>
  import { Entry } from 'cayo';
</script>
<!-- ...other page stuff -->
<Entry src="entry.js" />
```

Using the `<Entry>` component tells Cayo to use that file as the page's entry. The `src` attribute should point at JS file that is **relative to the [`src` directory](#source-directory)**, rather than relative to the page itself.

Note: the name `entry.js` is used in the examples, but there are no limitations on the path or name, as long as it's in the `src` directory.

### Render Hook

The Render Hook is a function named `renderCayos` that allows you to define when and how your Cayos should be rendered. You do not need to import the function—just call it from an entry, and Cayo will see this and handle the necessary import.

Using the Render Hook in an entry:
```js
// src/entry.js

// "When" you want to render Cayos
renderCayos()
```

It is indeed just that simple! But, a glaring question here may be: "where does `renderCayos` come from? It's not imported in the file?" The answer: _Cayo magic_! (Cayo adds an import for `renderCayos` in your entries as it processes your files.) 

As long as it is called in an entry, pages using that entry will have its Cayos rendered. Calling `renderCayos` can be thought of as telling the page to "render Cayos now", wherever it is in your entry's logic.

#### Callback
The Render Hook takes one argument, a callback: `renderCayos(callback<Function>)`. The callback should return the the target node—the node that the component should be mounted to. By default, the placeholder will be the target node, so the component will be mounted as child of `<div data-cayo-id="...">`. If you wanted to wrap it in a custom placeholder, you could do so by passing that logic via the callback. 

The callback argument should be a function that matches the following signature:
```js
/**
 * Callback for renderCayos
 * 
 * @param {HTMLElement} node – the placeholder node (the cayo instance placeholder <div>)
 * @return {HTMLElement} the target node
 */
function cb(node) {
  // do something with placeholder node
  // or, create a new element to use as a node
  // or, use a different node that exists on the page
  // ...whatever you want!

  // finally, return the node you want to use as the target
}
```

A Cayo will always be rendered as a child of the target node, per [Svelte's Client-side component API](https://svelte.dev/docs#run-time-client-side-component-api).

#### Callback Example
Say you want to render the Cayos wrapped in a custom placeholder:
```js
// src/index.js

// "Where" you want to render Cayos
function customPlaceholder(node) {
  // Say you want to 
  //   1. use a <section> element as the wrapper instead of a <div>
  //   2. use the Cayo ID as the element's id
  //   3. use a custom class '.custom-placeholder'
  node.outerHTML = `<section id="${node.dataset.cayoId}" class="custom-placeholder"></section>`;
  return node;
}
// "When" you want to render Cayos
renderCayos(customPlaceholder);
```

#### Callback Example: Loading State 
Say you want to render something in a Cayo before it gets hydrated, like a "loading" indicator. Using the same component from earlier, `counter.cayo.svelte`:

```svelte
<!-- src/pages/page.svelte -->
<script>
  import { Cayo, Entry } from 'cayo';
</script>
<Cayo src="counter.cayo.svelte">
  <!-- This will render inside the placeholder because the <Cayo> component renders a <slot> -->
  Loading counter...
</Cayo>
<Entry src="entry.js" />
```

```js
// src/entry.js

// "Where" you want to render Cayos
// Also, do something to the target node before the component is mounted
function replaceContents(node) {
  node.innerHTML = '';
  return node;
}
// "When" you want to render Cayos
renderCayos(replaceContents);
```

#### Return Cayos
The Render Hook returns a object that stores all of the Cayo instances of a page. Each keyed object within it looks like the following:
```js
{
  <cayoId>: {
    target: // the target node for the instance
    instance: // the Svelte component instance object
  }
}
```
Example:
```js
// src/entry.js
const cayos = renderCayos();
for (const [key, cayo] of Object.entries(cayos)) {
  // Do something with the cayo targets or instances
  console.log(key, cayo.target);
  console.log(key, cayo.instance);
}
```

## Styles

Since Vite has some [built-in CSS features](https://vitejs.dev/guide/features.html#css), things like Sass just work! Otherwise, [Svelte's component-scoped styles](https://svelte.dev/docs#component-format-style) are likely the best way to write styles while using Svelte. With the `svelte-preprocess` custom preprocessor, you get Sass and PostCSS support right in your Svelte files:

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

If you want to define global styles external to your Svelte files, you can do so the "Vite way", by importing the stylesheet into a page's entry file. 

Say you have a Sass file with all of your global styles, `src/styles/global.scss`:

Entry:
```js
// src/entry.js
import './styles/global.scss';
// ...other entry stuff
```
Page:
```svelte
<!-- src/pages/page.svelte -->

<!-- ...other page stuff -->
<slot name="entry">
  <script src="entry.js" data-cayo-entry />
</slot>
```

## Cayo & the Rest

**Cayo** is a static HTML generator, with islands of reactivity, file-based routing, and the power of Svelte & Vite. Cayo _is_ niche, and it's kinda meant to be! I built it for my use case, but intentionally made it configurable (and chose tools with good plugin ecosystems), so hopefully at least a few folks with similar needs can make use of it. Cayo borrows certain structural patterns from SvelteKit, some concepts like "island architecture" from Astro, and is powered by Svelte and Vite (and under the hood, Rollup too, independently of Vite). 

**These other tools are _probably_ what you're looking for. It's recommended to check out these first.** But, if you have constraints they can't support, or want something you can more easily hack, Cayo might be of help!

- **[Astro](https://astro.build/)** is a web framework for building fast, content-focused websites. Astro is the most similar to Cayo (in concept), and I recommend trying it out first before using Cayo.

- **[SvelteKit](https://kit.svelte.dev/)** is a framework for building web applications of all sizes, with a beautiful development experience and flexible filesystem-based routing. Also has the power of Svelte & Vite.

- **[ElderJS](https://elderguide.com/tech/elderjs/)** is an opinionated static site generator and web framework built with SEO in mind. The origin story of ElderJS is quite similar to Cayo's: some developers needed something tailored to their use case, so they decided to make it themselves. ElderJS includes a lot of cool features like "build hooks", SEO as a priority, and is also zero-JS first!
