import { viteBuildScript } from "./src/utils.js";
try {
  await viteBuildScript('prerender', true).then(()=> console.log('built dist/prerender.js')); 
} catch (err) {
  console.error(err);
}
