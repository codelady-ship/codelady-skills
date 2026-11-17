// node design/render-logo.cjs  → public/logo.png (1024), src/app/icon.png (512, no word pattern), src/app/apple-icon.png (180)
const path = require('path');
const puppeteer = require(path.join(__dirname, '../../marketing/reels/r1/node_modules/puppeteer-core'));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const file = 'file:///' + path.join(__dirname, 'logo.html').replace(/\\/g, '/');

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const p = await b.newPage();
  const shot = async (hash, out, size) => {
    await p.setViewport({ width: 1024, height: 1024, deviceScaleFactor: size / 1024 });
    await p.goto(file + hash, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(__dirname, '..', out), clip: { x: 0, y: 0, width: 1024, height: 1024 } });
    console.log('saved', out);
  };
  await shot('', 'public/logo.png', 1024);
  await shot('', 'design/logo-preview-512.png', 512);
  await shot('#plain', 'src/app/icon.png', 512);
  await shot('#plain', 'src/app/apple-icon.png', 180);
  await b.close();
})();
