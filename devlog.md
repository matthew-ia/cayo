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

Maybe just use the preprocessor to put the right path in there,
and then 