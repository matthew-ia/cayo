const fs = require('fs')
const path = require('path')
const express = require('express')
const { createServer: createViteServer } = require('vite')
const config = require('./vite.config.cjs');

const cayoConfig = {
	rootPath: 'test',
}
const loadConfigFile = require('rollup/dist/loadConfigFile');
const rollup = require('rollup');

// load the config file next to the current script;
// the provided config object has the same effect as passing "--format es"
// on the command line and will override the format of all outputs

async function createServer() {
  const app = express()

  // Create vite server in middleware mode. This disables Vite's own HTML
  // serving logic and let the parent server take control.
  //
  // If you want to use Vite's own HTML serving logic (using Vite as
  // a development middleware), using 'html' instead.
  const vite = await createViteServer({
    configFile: './vite.config.cjs',
    server: { middlewareMode: 'ssr' },
    // build: {
    //   watch: {
    //     // include: `./**/*`
    //   }
    // },
    // rollupOptions: {
    //   watch: {
    //     include: `./*`
    //   },
    //   // ssrAssetCollector: path.resolve(__dirname, './server-deps.js')
    // },
  })
  // console.log(vite);

  rolly();
  

  // const watcher = viteWatcher;
  // console.log('> WATCHER:', vite.watcher.getWatched());
  vite.watcher.on('change', async (path) => {
    console.log(`path ${path} changed`);
    if (path.endsWith('.svelte')) {
      rolly();
      // await vite.transformRequest('/other/')
      // let _mod = await vite.ssrLoadModule('./server-deps.js')
      // console.log("> MOD", _mod);
      // vite.moduleGraph.invalidateModule(_mod);
      // await vite.ssrLoadModule('./server-deps.js');
      // app.get('/', () => {})
    }
  })
  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    const { pathname: url } = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`)
    // const url = req.originalUrl
  
    console.log('> URL:', url);
    try {
      
      // 1. Read index.html
      // let template = fs.readFileSync(
      //   path.resolve(__dirname, 'index.html'),
      //   'utf-8'
      // )
      // console.log('> WATCHER:', vite.watcher.getWatched());

      const { Template, pages: _pages } = await vite.ssrLoadModule('./dist/server-deps.js');
      const { getPages } = await vite.ssrLoadModule('./src/utils.js');
      // const { Template } = await vite.ssrLoadModule('./dist/template.js');
      const template = Template.render();

      const pages = getPages('svelte', _pages);

      const { Renderer } = await vite.ssrLoadModule('./src/renderer.js')
      const renderer = new Renderer(template.html);
  
      // 2. Apply vite HTML transforms. This injects the vite HMR client, and
      //    also applies HTML transforms from Vite plugins, e.g. global preambles
      //    from @vitejs/plugin-react-refresh
      // let viteTemplate = await vite.transformIndexHtml(url, template.html)
  
      // 3. Load the server entry. vite.ssrLoadModule automatically transforms
      //    your ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.
      // const { render } = await vite.ssrLoadModule('/src/entry-server.js')
  
      // 4. render the app HTML. This assumes entry-server.js's exported `render`
      //    function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      // const appHtml = await render(url)
      // console.log('trying to render', url);
      let content;
      if (url !== '/main.js' || url !== '/favicon.ico') {
        content = renderer.render(url, pages[url])
      }
  
      // 5. Inject the app-rendered HTML into the template.
      // const html = template.replace(`<!--ssr-outlet-->`, content.html)
  
      // 6. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(content.html)
    } catch (e) {
      // If an error is caught, let vite fix the stracktrace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.status(500).end(e.message)
    }
  })

  app.listen(3000)
  console.log('serving at http://localhost:3000');
}

createServer()


function rolly() {
  loadConfigFile(path.resolve(__dirname, 'rollup.server.config.js'), { format: 'es' }).then(
    async ({ options, warnings }) => {
      // "warnings" wraps the default `onwarn` handler passed by the CLI.
      // This prints all warnings up to this point:
      console.log(`We currently have ${warnings.count} warnings`);
  
      // This prints all deferred warnings
      warnings.flush();
  
      // options is an array of "inputOptions" objects with an additional "output"
      // property that contains an array of "outputOptions".
      // The following will generate all outputs for all inputs, and write them to disk the same
      // way the CLI does it:
      for (const optionsObj of options) {
        // await prep();
        console.log('am doing it');
        const bundle = await rollup.rollup(optionsObj);
        await Promise.all(optionsObj.output.map(bundle.write));
        await bundle.close();
      }
  
      // const { prerender } = await import('./dist/prerender.js');
      // prerender();
  
      // You can also pass this directly to "rollup.watch"
      // const watcher = rollup.watch(options);
      // watcher.on('event', async (event) => {
      //   console.log(event.code);
      //   // if (event.code === 'END') {
      //   //   await import(`./dist/prerender.js?v=${hash()}}`).then(({ prerender }) => prerender() );
      //   // }
      // })
      // watcher.on('event', ({ result }) => {
      //   if (result) {
      //     result.close();
      //   }
      // });
  
      // watcher.close();
    }
  );
}