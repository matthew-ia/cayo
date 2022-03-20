// console.log("I'm main");

const cb = (node) => { 
  console.log('im side effecting');
  console.log(node);
  return node; 
}

function replaceContents ( node ) {
  node.innerHTML = '';
  return node;
}

import { default as renderComponents } from './cayo-runtime.js';
document.addEventListener('DOMContentLoaded', () => {
  renderComponents(replaceContents);
});
