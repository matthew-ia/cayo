# Cayo

Pronounced [ka-yo], meaning _little islands_.

A static HTML generator for the small stuff. With islands of reactivity (partial hydration). Powered by Svelte and Vite. 

## Why Cayo?

The main purpose of Cayo is to be a tool that lets you use modern front-end tooling (Svelte, Vite, file-based routing) to generate static HTML output, but still have the option to use Svelte components that are reactive during runtime.

**Cayo prerenders all of your components** (or just generericaly, Svelte "inputs", like a page), so your output is prebaked HTML. But, if you want that Svelte reactivity, you can have it, with Cayo Components (the "islands"), which are bundled components that mount to the output HTML during client runtime. 

**Cayo aims to be useful for simple static HTML sites, but doesn't actually care if your output really is a _page_.** You can think of it more like a Svelte-to-HTML generator—your output could be a valid HTML page, or it could just be an HTML fragment you intend to use in a unique workflow that has contraints (like me!).

**Cayo is built for that person who has contraints on their output**, and wants more control over their HTML generation workflow, and wants tools like Svelte and Vite at their disposal. All while not having to buy into the typical use of outputing an entire _website_, as Svelte and Vite are designed to be used to do.

**Cayo is not a replacement for a fully-featured framework** like SvelteKit. Read more about [how Cayo differs](#cayo-&-the-rest) from similar tools. For the curious (or confused), read more about [why I created Cayo](#why-i-created-cayo).

## Getting Started

The easiest way to get started is by using the default cayo template. You can use [Planter](https://planter.dev) to create a new cayo project with that template:

```zsh
# Create new project
npx @planter/cli matthew-ia/cayo/template ./new-project

# Go into the new project and install npm packages
cd new-project
npm i
```

In your cayo project run:
```zsh
cayo dev
```

Build your project:
```zsh
cayo build
```

You can also look at the template in this repo for reference: [/template](./template/). Learn about [configuring your project setup](#config).

## Project Structure

These folders would be present in your project if you used the template. By default, if your project doesn't have this structure it will not run. However, all of these folder paths and the template name can the can be customzed with [configuration options](docs/config.md).

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

For more info [see the full list of options](docs/config.md).

## Cayo & the Rest

**Cayo** is a static HTML generator with islands of reactivity, file-based routing, and the power of Svelte & Vite. Cayo _is_ niche, and it's kinda meant to be! I built it for my use case, but intentionally made it configurable (and chose tools with good plugin ecosystems), so hopefully at least a few folks with similar needs can make use of it. Cayo borrows certain structural patterns from SvelteKit, some concepts like "island architecture" from Astro, and is powered by Svelte and Vite (and under the hood, Rollup too, independently of Vite). 

**These other tools are _probably_ what you're looking for. (But, if you have constraints they can't support, Cayo might be of help!)**

**SvelteKit** is "a framework for building web applications of all sizes, with a beautiful development experience and flexible filesystem-based routing." Also has the power of Svelte & Vite.

**Astro** is "a web framework for building fast, content-focused websites." Astro is the most similar to Cayo, and for most use cases, it's probably the right choice. It inspired Cayo's island architecture and has a lot more features, and a lot of smart folks behind it! It's also front-end framework agnostic, which is pretty neat. (You can even use Svelte and React in the same project!)

**Svelte** is a component framework, like React or Vue, with the key difference being that it acts as a compiler that runs during build time, to transform your components into code that updates the DOM. It's awesome, and the Svelte API is the backbone of Cayo.

**Vite** is a fast and easy to config dev and build tool that supports a lot of front-end libraries & frameworks, like Svelte. It also has a nice-sized plugin ecosystem, and uses by Rollup). 

## Why I Created Cayo

With so many other great tools out there, it does seem kind of silly to create a new, pretty niche tool with less features. It really came down to me having limitations to how I can build web pages on the particular web platform we use at work. Most of the pages I work with are content pages, with no need for any data flow to a database, and in general have small bits of interactvity (carousels, modals, etc). The "big stuff" is handled all within the source code of the web platform's framework. I don't have access to that source code, but I do have access to a CMS that essentially lets me upload HTML snippets them as a static page, or as a static _part_ of page. I call that the "little stuff."

Also, I love Svelte. I wanted to use Svelte to write those HTML snippets. Since Svelte really is a compiler at heart, it seemed like the perfect fit. I realized I could use the Svelte API to server side render (SSR) them to HTML strings in any node environment, like in a CLI.

Another requirement was: little-to-no-JS. For most of the content I build to then be imported into the CMS, it's completely static. Occasionally I need some JS to make a carousel do its thing. But, my JS can only be imported via a `<script>` within my HTML snippet—that means my JS gets loaded last, after anything already being loaded by the web platform in the <head>. Ultimartely, I've gotta be careful about when/what JS is running in my HTML snippets, as their JS always gets delayed. 

That's where Cayo Components come in. I wanted to be able to give the power of Svelte to those limited cases where I do need interactivity (JS). For the "islands of reactivity", or _cayos_, instead of SSR-ing these components, I bundle them up as JS for client side rendering (CSR). CSR components just require the Svelte vendor code to run, which is pretty small. And the output bundle is typically pretty small (but does scales with the complexity of the component itself), so I wasn't too worried about the overhead to have Svelte components run client side.

Cayo wouldn't be possible without the team and ingenuity behind [Svelte](), of course, and other tools like [Astro]() that heavily inspired Cayo's island architecture with a zero-JS-first bias.