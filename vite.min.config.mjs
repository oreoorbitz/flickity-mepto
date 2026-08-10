import fs from 'fs';
import { resolve } from 'path';
const pkg = JSON.parse(fs.readFileSync('./package.json','utf8'));
const banner = `/*! Flickity PACKAGED v2.3.0-mepto (${pkg.version}) — Mepto-integrated, jQuery-free */\n`;
export default {
  build: {
    lib: {
      entry: resolve('src/index.js'),
      name: 'Flickity',
      formats: ['es', 'iife'],
      fileName: (format) => format === 'es' ? 'flickity.esm.min.js' : 'flickity.pkgd.min.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      external: ['mepto', 'jquery'],
      output: {
        banner,
        globals: { mepto: 'mepto', jquery: 'jQuery' },
      },
    },
    minify: 'esbuild',
    esbuildOptions: { legalComments: 'inline' },
  },
};
