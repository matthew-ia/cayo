I keep forgetting what the heck I'm doing with this code, so here is where I'll log current progress

## 2022.5.28

- I think I was working on getting components to work in the new rollup workflow
- Noticed last time that saving a component file causes an error, so

Thinking that maybe this problem is from leftovers; before rollup we needed to create JS module versions of Svelte components, but now they get bundled with the page's module. The only components that do need to exist as a separate dependency (that gets module-ified) are Cayo components. Think I can just remove all the dependency handling stuff for components, and just make sure their dependee pages are rerendered

Also, prerender can't seem to get the Cayo component names anymore. groups is null, which may just mean it needs a try-catch?

So I think some re-org needs to happen, because the error is indeed happening where the regex is. I can write a new regex, but the format of the component name/id is the src version (user input, which is just a path), instead of the dependency processed version, which creates a unique name based on the folder structure. I could do a few things:
  1. abstract the processing code to a utility function that I can use both in dependencies.js and prerender.js
    - depdencies.js actually uses it to replace the import name at the top of the file, I think
  2. reorg the workflow for components, still abstract the unique rename utility function, but preprocess the markup during the preprocess step instead. That way, anything looking at the code

  So I actually already noted that #2 is [what to do here](https://github.com/matthew-ia/cayo/issues/50#issuecomment-1086516314), lmao.

  Breaking down what actuall needs to be done:
    1. Internal preprocessor (cayoPreprocess) should be passed to rollup.bundle before sveltePreprocess
    2. cayoPreprocess runs a markup preprocessor function; that preprocessor runs multiple transformers, including one to specifically handle the unique cayo component names
      - cayo src (prop name) -> cayo ID (unique name based on src + hash)
        - src: needed by dependencies.js at the moment to run 
        - id: needed by runtime stuff, should match the filename of the bundled cayo component module

Right now, prerender.js does create a list of the cayoComponenents and update the stats list, but I think it does that there only because that's where I had been doing the markup processing to get those Cayo component names. I should be able to do the stats stuff in preprocess just fine. 

I think most of prerender.js should actually be in preprocess; the only thing that it should do is actually prerender the page with the template. 

P.S. stats might be broken because I see it write a mostly empty object; no pages or components are listed. I think when the rollup switchover happened it prob stopped working

## 2022.6.22

Worked mostly regarding the imports stuff in preprocess/index.js. I think a new bug has been introduced somewhere with aliases, when trying to use the #cayo alias in the temporary test/ folder in cayo itself. To fix, I created a new test repo outside of the cayo repo in order to test as a normal package. This is probably better, and now it's working. Just had to add some "library/package" support as detailed by Svelte folks within the package.json of cayo, and change the path references in the test/src. E.g., `import Cayo from 'cayo'` is valid now. 

## 2022.7.31

### Import Stuff

Fixed the import/export stuff. `import Cayo from 'cayo/component'` works now. 

`import Cayo from 'cayo'` still works too, but I think I might deprecate that. In case anything makes sense to expose directly from the root of the package. Unless, I want to make the this work:
`import { component as Cayo } from 'cayo'`, but I think the new 'cayo/component' one works more like how Svelte looks/works when you're working within your own project (always exports component as default).

### Actual Stuff

Question to answer: do we need the src string at all, since we are compiling the child components into each page?

We do need to recompile the page when a child component changes. Maybe that's why we need it? (Could it from here, but use it elsewhere). 

---

Okay so I got the markup preprocessor working with the AST -> string manipulation thing for Cayo IDs. Next up: make sure the IDs are correct, and would match how they'll be named in the actual output. 

## 2022.8.1

Moved the cayoID stuff back to prerender, bc it's easier to just do it with JSDOM and after it's compiled to HTML.
However, I'm running into the issue of the original paths for the Cayo component src attribute being relative to the component rendering it, not the page. And at the HTML level, I don't know where it was. 

I think I Do still need to do some preprocessing to change the Cayo src's to be relative to the project root, so I know where the actual component is in the src files when I'm creating those IDs and getting a list of Cayo components. Unless I should just grab those Cayo component paths early, and pass them along. Not sure yet. 

Think if we do it in preprocess, we'll need to parse -> walk the ast in both script and markup. Change src=<this>
or if it's an object defined in script, just find it by any instance of '.cayo.svelte' and replace it with the relative-to-root path. The getRelativeToRootPath logic can be extracted into a helper, but the walking has to be done
individually, because we'll be looking for different AST types. Prob just Text in scriptPreprocessor and then what we
already had in markupPreprocessor

---

Decided to simply change the requirements of the src prop to be that it has
to be relative to your components dir. Bam, all the problems solved, and no
path math required. 

## 2022.8.2

Alright so I pretty much fixed handleDependencies (and thus, stats), which is cool, but components are still structured to "compile" even though I just need to get their deps, so
I have the dep tree.

When _needs_ to happen when a component is touched, instead of compile it, we need to compile any pages that render it, either directly or via another component. 


## 2022.8.7

Made it so pages compiled and written on start. This may have worked at one point, and this is a revival? But even if it used to work, it needed to be reworked because with the latest structure, a page can be compiled to a bundle, that bundle can be written to a file, and that bundle can be loaded as a module, all as a part of the Page API. 

E.g.,
```js
// some.js
let pages = [srcPageFilePath]
// Normally, we'd be working with more than one page, but this is how you'd
// work with just one page, for explanation purposes.
// 
// Compile the page (always expects an array of pages, but can be one)
// We also get an array back, of Page objects. So here, we are just
// destructuring the array to get the one result of the one path put in
const [ page ] = compile.pages(pages, ...)
// Write the bundle to a file
await page.writeModule()
// Loads with cash-busting method, so it's always up to date
await page.loadModule()
// Render the page
await page.render(false, stats.cayoComponents);
// Finally, write all of the prerendered page files (HTML, JS, CSS)
writePageFiles(page, config.cayoPath, config);
```

Only optimization I'd consider it making these Page methods runnable from a single function. Maybe something like:

```js
// page.js
class Page {
  // ...
  process(cayoComponents) {
    this.writeModule()
    this.loadModule()
    this.render(false, cayoComponents);
  }
}

// some.js
await page.process(stats.cayoComponents) 
writePageFiles(page, config.cayoPath, config);
```

Right now, a similar usage for compiling pages is only used in `handlePages` in `cli/watch.js` and in the main function `run` in `cli/index/js`, as far as I know. 

--- 

Just realized I was wrong, `writeModule` actually does nothing now. That is handled in `compile/pages.js`. So we could more reasonably update the usage to just have `page.render(...)` run load before it runs prerender. (There was already a `load` arg defaulted to false, that is in the signature for `render`. I had forgotten what that did, and it looks like I either removed its functionality or never added it. Now I think I can, since we've figured out how the compile/bundling works (now with Rollup)

Edit: I went ahead and did this, but changed the load arg to a member of an options object:

```js
await page.render(stats.cayoComponents, { load: true })
```


### This is what's Next

- [ ] Make sure the above doesn't need to apply to Layout in a similar way
- [x] Getting the client-side Cayo component files to be output
```
[plugin:vite:import-analysis] Failed to resolve import "/__cayo/components/Test.js" from ".cayo/cayo-runtime.js". Does the file exist?

/Users/malicea/home/main/01 dev/code/test-cayo/.cayo/cayo-runtime.js:1:23

1  |  import { Test } from '/__cayo/components/Test.js';
   |                        ^
2  |  
3  |  function getProps(cayoId) {
  ```

- [ ] Rewrite handleComponents in `cli/watch.js` to work with the new structure, and recompile and rerender pages that its changes affect.
- [ ] Consider renaming `__cayo` to `__compiled` to be more indicative of what those files are. Also, at the very least, the double "cayo" in `.cayo/__cayo` looks kind of confusing.

### Later that day...

Got Client-side Cayo components to output. Next: watching components and rebuilding their pages, and watching cayo components and rebuilding their client-side component version. 


## 2022.8.9

Got watching to work, and the pages get rerendered. Still need to do the cross-dependency analysis for instances where I edit B.svelte, which is imported into A.svelte, but page.svelte imports only A.svelte.

When editing B, need to see the dependency chain: B -> A -> page.

Since we start with B path, we have to look through the dep tree for an instance of B, then get the depender path. Then once we have the depender (A) path, do the same thing: look through dep tree for an instance of A.

So, recursively search for a dependee's dependers until we hit a page, then rerender it.
