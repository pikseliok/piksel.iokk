const fs = require('fs');
const { minify } = require('html-minifier-terser');

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');

(async () => {
  for (const f of fs.readdirSync('.')) {
    if (!f.endsWith('.html')) continue;
    const out = await minify(fs.readFileSync(f, 'utf8'), {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    });
    fs.writeFileSync('dist/' + f, out);
    console.log('OK:', f);
  }
})();
