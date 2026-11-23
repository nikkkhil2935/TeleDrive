const fs = require('fs');
const path = require('path');

async function downloadAndEmbed() {
  const fontsDir = path.resolve(__dirname, '../public/fonts');
  if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

  const fonts = [
    {
      family: 'Anton',
      style: 'normal',
      weight: '400',
      url: 'https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-C8.woff2',
      filename: 'anton-latin-400.woff2'
    },
    {
      family: 'Caveat Brush',
      style: 'normal',
      weight: '400',
      url: 'https://fonts.gstatic.com/s/caveatbrush/v12/EYq0maZfwr9S9-ETZc3fKXt8XLOS.woff2',
      filename: 'caveat-brush-latin-400.woff2'
    },
    {
      family: 'Inter Tight',
      style: 'normal',
      weight: '100 900',
      url: 'https://fonts.gstatic.com/s/intertight/v9/NGSwv5HMAFg6IuGlBNMjxLsH8ag.woff2',
      filename: 'inter-tight-latin-variable.woff2'
    }
  ];

  let cssOutput = '/* Self-hosted Google Fonts: Inter Tight, Caveat Brush, Anton (latin woff2 embedded) */\n\n';

  for (const f of fonts) {
    const res = await fetch(f.url);
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    
    // Save to public/fonts
    fs.writeFileSync(path.join(fontsDir, f.filename), buf);
    console.log('Saved', f.filename, buf.length, 'bytes');

    const base64 = buf.toString('base64');
    const dataUri = 'data:font/woff2;charset=utf-8;base64,' + base64;

    cssOutput += `@font-face {
  font-family: '${f.family}';
  font-style: ${f.style};
  font-weight: ${f.weight};
  font-display: swap;
  src: url('${dataUri}') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

`;
  }

  fs.writeFileSync(path.resolve(__dirname, '../src/fonts.css'), cssOutput, 'utf8');
  console.log('Successfully generated src/fonts.css with base64 embedded woff2!');
}

downloadAndEmbed().catch(err => {
  console.error(err);
  process.exit(1);
});
