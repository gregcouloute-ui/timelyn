// usage: node frames.mjs <outDir> <fps> [t1,t2,...]   (no list = whole video)
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const [out, fpsArg, list] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: [...chromium.args, '--allow-file-access-from-files'], headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
const errors = []; p.on('pageerror', (e) => errors.push(String(e)));
await p.goto('file:///tmp/claude-0/-home-claude/ca18f415-f1ed-586d-9bd4-0f283c8cb572/scratchpad/video/explainer.html', { waitUntil: 'networkidle0' });
await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
const fps = Number(fpsArg);
const duration = await p.evaluate(() => window.DURATION);
const times = list ? list.split(',').map(Number) : Array.from({ length: Math.round(duration * fps) }, (_, i) => i / fps);
const stage = await p.$('#stage');
let n = 0;
for (const t of times) {
  await p.evaluate((t) => window.render(t), t);
  await stage.screenshot({ path: `${out}/${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
}
console.log('frames', n, errors.length ? errors : 'ok');
await b.close();
