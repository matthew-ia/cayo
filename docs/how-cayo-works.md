# How Cayo Works

A few explanations of how things work within Cayo. This isn't needed to be known in order to use Cayo, but it can be helpful if you're curious.


## Render Hook

The generated hook function looks something like this in `cayo-runtime.js` files:
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

**Note:** `getProps()` is also generated in `cayo-runtime.js`. It handles parsing the props as a string, to use the props to hydrate the Cayo instance.