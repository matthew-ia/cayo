# Cayo

> Pronounced [ka-yo], meaning _little island_.

A static HTML generator for the small stuff. With islands of reactivity. Powered by Svelte and Vite. 

## Why Cayo?

The main purpose of Cayo is to be a tool that lets you use modern front-end tooling (Svelte, Vite, file-based routing) to generate static HTML output, but still have the option to use Svelte components that are reactive during runtime.

**Cayo prerenders all of your components** (or just generically, Svelte "inputs", like a page), so your output is pre-baked HTML. But, if you want that Svelte reactivity, you can have it, with Cayo Components (the "islands"), which are bundled components that mount to the output HTML during client runtime. 

**Cayo aims to be useful for simple static HTML sites, but doesn't actually care if your output really is a _page_.** You can think of it more like a Svelte-to-HTML generator—your output could be a valid HTML page, or it could just be an HTML fragment you intend to use in a unique workflow that has constraints (like me!).

**Cayo is built for that person who has constraints on their output**—someone who wants more control over their HTML generation workflow, and wants tools like Svelte and Vite at their disposal. All while not having to buy into the typical use of outputting an entire _website_, as Svelte and Vite are designed to be used to do.

**Cayo is not a replacement for a fully-featured framework** like Astro or SvelteKit. Read more about [how Cayo differs](#cayo-&-the-rest) from similar tools.

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

You can also look at the template in this repo for reference, in [/template](./template/). Learn about [configuring your project setup](#config).

## Project Structure

These folders will be present in your project if you use the template. By default, if your project doesn't have this structure it will not run. However, all of these folder paths, and the template name, can the can be customized with [configuration options](docs/config-reference.md).

**Example**
```
src
  - pages
    - index.svelte
  - components
    - some.cayo.svelte
  - __template.svelte
  - entry.js
public
  - image.png
  - favicon.ico
  - p5.min.js
```

### `src`
Default: `/src`
All of your source files should go in `/src`. This is where pages, components, styles, etc should go. These files will be watched during while running `cayo dev`, and used to build your project.

### Template File
This is file is required and used to render all of your pages. The output will match this file's markup, but replace the cayo placeholders with their respective markup. This file is a Svelte component, so you can also import other Svelte components or use rendering logic. For example, to render certain markup as output based the mode: `development` vs. `production` (i.e., `cayo dev` vs. `cayo build`).

The template cayo placeholders:
- `%cayo.body%` – the main content of a page. (Think of this like the <slot> of the Template Svelte component.)
- `%cayo.script%` – the is where your [entry script](#entries) (JS) for a page will be imported. 
- `%cayo.head%`
- `%cayo.title%`
- `%cayo.css%`    

#### Example
Technically all of these placeholders are optional, and don't have to be in any particular place. That means your template doesn't even have to actually be a valid HTML document at all—your output could be HTML fragments that you use in some unique workflow (other than treating them as web pages you'll load directly on a client).

```html
<!-- src/__template.svelte -->

<!DOCTYPE html>
<html>
  <head>
    <!-- If you want to use the  -->
    %cayo.title%
    %cayo.css%    
    %cayo.head%
  </head>
  <body>
    <!-- page's content goes here  -->
    %cayo.body%
    <!-- this is like adding a main.js for page -->
    %cayo.script%
  </body>
</html>

```

### Pages
Default: `/src/pages`

#### Entries


### Components
Default: `/src/pages`

### Public
Default: `/public`


## Config

Your project doesn't need a config file, but if you want to customize your setup, you can do so by creating a `cayo.config.js` file at your project's root.

```js
// cayo.config.js
export default {
  // config options
}
```

For all options, read the [Configuration Reference](docs/config-reference.md).

## Cayo & the Rest

**Cayo** is a static HTML generator with islands of reactivity, file-based routing, and the power of Svelte & Vite. Cayo _is_ niche, and it's kinda meant to be! I built it for my use case, but intentionally made it configurable (and chose tools with good plugin ecosystems), so hopefully at least a few folks with similar needs can make use of it. Cayo borrows certain structural patterns from SvelteKit, some concepts like "island architecture" from Astro, and is powered by Svelte and Vite (and under the hood, Rollup too, independently of Vite). 

**These other tools are _probably_ what you're looking for. It's recommended to look into these first. (But, if you have constraints they can't support, Cayo might be of help!)**

**Astro** is "a web framework for building fast, content-focused websites." Astro is the most similar to Cayo (in concept), and I recommend trying it out first before using Cayo.

**SvelteKit** is "a framework for building web applications of all sizes, with a beautiful development experience and flexible filesystem-based routing." Also has the power of Svelte & Vite.

**ElderJS** is an opinionated static site generator and web framework built with SEO in mind. The origin story of ElderJS is quite similar to Cayo's: people needed to something tailored to their use-case, so they decided to make it themselves. ElderJS includes a lot of cool features like "build hooks", and is also zero-JS first!

---

## Contributions

Since Cayo was built and designed specifically for use case at work, it probably won't be actively maintained nor will it take pull requests unless they fix bugs or generally expand upon it's configurability. Forking and building upon Cayo for your own use case is heavily encouraged!
