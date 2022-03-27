import { rollup } from 'rollup';
// import esbuild from 'esbuild';
// reference this when we  decide we want to try to use esbuild:
// https://github.com/evanw/esbuild/issues/619#issuecomment-1017918747

// TODO: add a function that only gets the dependencies of an input file
// need to do this when running handleDependencies on a page, so I can surely get
// the nested deps, which my recursive thing doesn't seem to get, and this might be faster anyway.
// 
// I think what I'd actually want to do is just rewrite a good bit of dependencies.js 
// to use this new getDeps function

export async function build(input) {

  const inputOptions = { 
    input, 
    onwarn: function ( message ) {
      if ( /external dependency/.test( message ) ) return;
      console.error( message );
    },
  };

  let bundle;
  let output = {
    code: '',
    dependencies: [],
  };

  try {
    // create a bundle
    bundle = await rollup(inputOptions);

    // an array of file names this bundle depends on
    output.dependencies = bundle.watchFiles;
    // the plain text code of the bundle output
    output.code = await generateOutputs(bundle);

    return output;

  } catch (error) {
    // do some error reporting
    console.error(error);
  }
  if (bundle) {
    // closes the bundle
    await bundle.close();
  }
}

async function generateOutputs(bundle) {
  const outputOptions = { }
  // generate output specific code in-memory
  // you can call this function multiple times on the same bundle object
  // replace bundle.generate with bundle.write to directly write to disk
  const { output } = await bundle.generate(outputOptions);

  return output[0].code;
}
