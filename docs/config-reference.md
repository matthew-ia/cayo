# Config Reference


## Config File
Cayo supports having _no_ config, but using a `cayo.config.js` file in your project allows you to configure most of the things that cayo needs & expects, such as paths for pages, components, and even the template filename.


### Example
```js
// cayo.config.js
export default {
  // config options
  svelte: {
    // svelte options, e.g., for defining preprocessors for svelte.preprocess

  },
  // Vite options get consumed by the dev server
  vite: {
    // Rollup options are also used during cayo build (passed to vite)
    rollupOptions: {
      // rollup options, like plugins
    }
  }


}
```

## Advanced Config