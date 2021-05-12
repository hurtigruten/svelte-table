import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    output: [
      { file: pkg.module, format: 'es' },
      { file: pkg.main, format: 'umd', name: 'window', extend: true }
    ],
    plugins: [
      svelte({
        compilerOptions: {
          dev: false,
          css: true
        },
        emitCss: false
      }),
      resolve({
        browser: true,
        dedupe: ['svelte']
      }),
      commonjs()
    ]
  },
  {
    input: 'src/index.d.ts',
    output: [{ file: pkg.types, format: 'es' }],
    plugins: [dts()]
  }
];
