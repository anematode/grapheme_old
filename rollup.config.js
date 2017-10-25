import minify from 'rollup-plugin-minify-es';

export default {
  entry: 'src/grapheme.js',
  dest: 'build/grapheme.min.js',
  format: 'iife',
  moduleName: 'Grapheme',
  plugins: [
    minify()
  ]
};
