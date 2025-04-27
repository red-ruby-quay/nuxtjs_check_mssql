const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['app.js'], // Absolute path
  bundle: true,
  platform: 'node',
  outfile: 'dist/app.js',
  minify: true,
  external: ['mssql', 'chokidar', 'dotenv'],
}).catch(() => process.exit(1));