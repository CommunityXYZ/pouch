const { build } = require('esbuild');
const rimraf = require('rimraf');

const clean = async () => {
  return new Promise(resolve => {
    rimraf('./dist', () => resolve());
  });
}

const runBuild = async (doClean = false) => {
  // Do not clean each time on watch, only on build or first run.
  if(doClean) await clean();
 
  // Build to browser js
  build({
    entryPoints: ['./src/pouch.ts'],
    minify: false,
    bundle: true,
    outfile: './dist/pouch.js'
  }).catch((e) => {
    console.log(e);
    process.exit(1)
  });

  // Minified version
  build({
    entryPoints: ['./src/pouch.ts'],
    minify: true,
    bundle: true,
    outfile: './dist/pouch.min.js'
  }).catch((e) => {
    console.log(e);
    process.exit(1)
  });
};
runBuild(true);

module.exports = runBuild;