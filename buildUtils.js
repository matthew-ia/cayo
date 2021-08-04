import { spawn } from 'child_process';

export default async function viteBuildScript(moduleName) {
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
  
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, { shell: true, stdio: 'inherit' });
    // Resolve promise
    process.on('close', (code) => {
      resolve(code)
    });
    // Reject promise
    process.on('error', (err) => {
      console.error(`Couldn't build module: src/${moduleName}.js`);
      reject(err)
    });
  });
}

viteBuildScript('utils');