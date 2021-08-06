import { spawn } from 'child_process';

export async function build(moduleName, verbose) {
  const cmd = 'vite';
  const args = [
    'build', 
    // Path to prerender config
    // TODO: this should be contained somewhere other than root of this package I think
    '--config', './vite.prerender.config.js', 
    // Output directory
    '--outDir', 'dist', 
    // File to build (output is runnable in node env)
    '--ssr', `src/${moduleName}.js`
  ];

  const options = verbose ? { shell: true, stdio: 'inherit' } : {}
  
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, options);
    // Resolve promise
    process.on('close', (code) => {
      resolve(code)
    });
    // Reject promise
    process.on('error', (err) => {
      console.error(`Error building module: src/${moduleName}.js`);
      console.error(err);
      reject(err)
    });
  });
}

build('prerender', true);
