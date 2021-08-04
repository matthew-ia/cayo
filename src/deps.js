import * as cheerio from 'cheerio';


/*

import MyComponent from './MyComponent.svelte';

window.MyComponent = function (options) {
    return new MyComponent(options);
};

document.addEventListener("DOMContentLoaded", function (event) {
  new MyComponent({
      target: document.getElementById("my-component"),
      hydrate: true,
      props: { ... },
  });
});


*/


export function handlePageDeps(deps) {
  // use cheerio
  // find script.src, 
  // copy over the corresponding file from users src folder
  // 
  // find components
  // 
  const $ = cheerio.load(html, options, false);

  return
}

function getComponents() {

}

function getEntry() {

}