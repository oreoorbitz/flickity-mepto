import fs from 'fs'
import { resolve } from 'path'
import { babel } from '@rollup/plugin-babel'
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
const banner = `/*! Flickity PACKAGED v2.3.0-mepto (${pkg.version}) — Mepto-integrated, jQuery-free */\n`
export default {
  build: {
    lib: {
      entry: resolve('src/index.js'),
      name: 'Flickity',
      formats: ['es', 'iife'],
      fileName: format => (format === 'es' ? 'flickity.esm.min.js' : 'flickity.pkgd.min.js'),
    },
    outDir: 'dist',
    emptyOutDir: false,
    target: 'esnext',
    rollupOptions: {
      external: ['mepto', 'jquery'],
      output: {
        banner,
        globals: { mepto: 'mepto', jquery: 'jQuery' },
      },
      plugins: [
        babel({
          babelHelpers: 'bundled',
          extensions: ['.js'],
          exclude: /node_modules/,
        }),
      ],
    },
    minify: 'esbuild',
    esbuildOptions: { legalComments: 'inline' },
  },
}
