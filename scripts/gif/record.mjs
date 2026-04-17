// Record the notch-reveal HTML as a series of PNG frames.
// Frames are emitted at 25fps across a ~5s timeline:
//   0.0-0.8s  idle (collapsed)
//   0.8-1.2s  reveal (hover animation — CSS transitions 0.35s + 0.25s delay on callouts)
//   1.2-3.5s  hold (panel + callouts visible)
//   3.5-3.9s  collapse
//   3.9-5.0s  idle

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'notch-reveal.html');
const framesDir = path.join(__dirname, 'frames');

fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const WIDTH = 1000;
const HEIGHT = 700;
const FPS = 25;
const DURATION_MS = 5000;
const TOTAL_FRAMES = Math.floor((DURATION_MS / 1000) * FPS);

// Timeline markers (in ms)
const HOVER_START = 800;
const HOVER_END = 3500;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto('file://' + htmlPath);
await page.waitForLoadState('networkidle');
// Give Google Fonts a moment to paint
await page.waitForTimeout(500);

const stage = await page.$('#stage');
const box = await stage.boundingBox();
const hoverPoint = { x: box.x + box.width / 2, y: box.y + 40 };

const bodyBox = await page.evaluate(() => {
  const wrap = document.querySelector('.m-wrap').getBoundingClientRect();
  const stage = document.querySelector('#stage').getBoundingClientRect();
  // Clip from top of wrap down to bottom of stage (skip trailing whitespace).
  // Add a little breathing room below and account for callouts that extend
  // past the stage on the sides.
  const callout = document.querySelector('.m-c4').getBoundingClientRect();
  const bottom = Math.max(stage.bottom, callout.bottom) + 24;
  return { x: wrap.left, y: wrap.top, width: wrap.width, height: bottom - wrap.top };
});

// Move cursor to a neutral spot first
await page.mouse.move(10, 10);

const startTs = Date.now();
for (let i = 0; i < TOTAL_FRAMES; i++) {
  const targetTs = (i / FPS) * 1000;

  // Trigger hover/unhover at timeline markers
  if (i > 0 && Math.floor(((i - 1) / FPS) * 1000) < HOVER_START && targetTs >= HOVER_START) {
    await page.mouse.move(hoverPoint.x, hoverPoint.y);
  }
  if (i > 0 && Math.floor(((i - 1) / FPS) * 1000) < HOVER_END && targetTs >= HOVER_END) {
    await page.mouse.move(10, 10);
  }

  // Wait until real-time catches up to the target frame
  const elapsed = Date.now() - startTs;
  if (elapsed < targetTs) {
    await page.waitForTimeout(targetTs - elapsed);
  }

  const filePath = path.join(framesDir, `frame-${String(i).padStart(4, '0')}.png`);
  await page.screenshot({
    path: filePath,
    clip: {
      x: Math.floor(bodyBox.x),
      y: Math.floor(bodyBox.y),
      width: Math.ceil(bodyBox.width),
      height: Math.ceil(bodyBox.height),
    },
  });
}

await browser.close();
console.log(`Wrote ${TOTAL_FRAMES} frames to ${framesDir}`);
