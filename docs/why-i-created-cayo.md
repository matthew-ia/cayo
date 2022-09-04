## Why I Created Cayo

With so many other great tools out there, it does seem kind of silly to create a new, pretty niche tool with less features. It really came down to me having limitations to how I can build web pages on the particular web platform we use at work. Most of the pages I work with are content pages, with no need for any data flow to a database, and in general have small bits of interactivity (carousels, modals, etc). The "big stuff" is handled all within the source code of the web platform's framework. I don't have access to that source code, but I do have access to a CMS that essentially lets me upload HTML snippets them as a static page, or as a static _part_ of page. I call that the "little stuff."

Also, I love Svelte. I wanted to use Svelte to write those HTML snippets. Since Svelte really is a compiler at heart, it seemed like the perfect fit. I realized I could use the Svelte API to server side render (SSR) them to HTML strings in any node environment, like in a CLI.

Another requirement was: little-to-no-JS. For most of the content I build to then be imported into the CMS, it's completely static. Occasionally I need some JS to make a carousel do its thing. But, my JS can only be imported via a `<script>` within my HTML snippet—that means my JS gets loaded last, after anything already being loaded by the web platform in the <head>. Ultimately, I've gotta be careful about when/what JS is running in my HTML snippets, as their JS always gets delayed. 

That's where Cayo Components come in. I wanted to be able to give the power of Svelte to those limited cases where I do need interactivity (JS). For the "islands of reactivity", or _cayos_, instead of SSR-ing these components, I bundle them up as JS for client side rendering (CSR). CSR components just require the Svelte vendor code to run, which is pretty small. And the output bundle is typically pretty small (but does scales with the complexity of the component itself), so I wasn't too worried about the overhead to have Svelte components run client side.

### Okay, but can't SvelteKit and Astro do all of those things?

Mostly, yes! And that's why Cayo is not recommended for most projects; those other frameworks are great for most people. 

SvelteKit does have an adapter that is for using it as a "static site generator" (SSG), but I found that it still doesn't quite get you to a zero-JS output. Because SvelteKit is much more than an SSG, it isn't tailored to be one, so your output still includes some JS files and a hydration script on your page, even if you don't have _any_ JS for that page to make use of all that overhead/setup. For most people, that doesn't really matter! For my use case, I'd need to run scripts to comb through all that unnecessary overhead and remove it from the markup. That's much easier than creating an entirely new tool, but since SvelteKit is still in beta at the time of writing Cayo, I didn't want to find myself wrestling with SvelteKit as it's in flux.

SvelteKit also doesn't support partial hydration within a page. It does however support prerendering page A, and hyrdrating page B, but that's not quite the same as island architecture.

Astro, however, does check nearly every box for me. It supports island architecture (and their Astro Components have more features than Cayo Components). Their output doesn't include all the extra that SvelteKit includes when it doesn't need it. _At the time I set out to create Cayo_, the only thing missing for me was Vite—I wanted to be able to make use of Vite's plugin ecosystem. Now, it does use Vite. (So, go use Astro.)

I studied Svelte, SvelteKit, and Astro docs and source code for hours throughout building Cayo; it really wouldn't exist without being inspired by those teams and ingenuity behind those projects.