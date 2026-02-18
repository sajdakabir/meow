#!/usr/bin/env node

/**
 * generate-sounds.js
 *
 * Generates placeholder WAV files (16-bit mono PCM, 44100 Hz, ~10 s each)
 * for a focus/ambient-sound app.
 *
 * Each sound uses a different noise-synthesis strategy so they are
 * perceptually distinct even though they are purely synthetic.
 */

const fs = require("fs");
const path = require("path");

// -- Audio parameters ---------------------------------------------------------
const SAMPLE_RATE = 44100;
const DURATION = 10; // seconds
const NUM_SAMPLES = SAMPLE_RATE * DURATION;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;
const MAX_AMP = 32767;

const OUTPUT_DIR = path.resolve(
  __dirname,
  "..",
  "renderer",
  "public",
  "sounds"
);

// -- Helpers ------------------------------------------------------------------

/** Uniform random in [-1, 1] */
function rand() {
  return Math.random() * 2 - 1;
}

/** Clamp a float sample to [-1, 1] */
function clamp(v) {
  return Math.max(-1, Math.min(1, v));
}

/** Simple one-pole low-pass filter (coefficient a in [0,1], higher = more filtering) */
function makeLowPass(a) {
  let prev = 0;
  return (x) => {
    prev = prev * a + x * (1 - a);
    return prev;
  };
}

/** Write a 44-byte RIFF/WAV header followed by 16-bit PCM data. */
function writeWav(filePath, floatSamples) {
  const numSamples = floatSamples.length;
  const dataBytes = numSamples * (BITS_PER_SAMPLE / 8);
  const fileSize = 44 + dataBytes;

  const buf = Buffer.alloc(fileSize);
  let off = 0;

  // RIFF header
  buf.write("RIFF", off);
  off += 4;
  buf.writeUInt32LE(fileSize - 8, off);
  off += 4;
  buf.write("WAVE", off);
  off += 4;

  // fmt  sub-chunk
  buf.write("fmt ", off);
  off += 4;
  buf.writeUInt32LE(16, off);
  off += 4; // sub-chunk size
  buf.writeUInt16LE(1, off);
  off += 2; // PCM
  buf.writeUInt16LE(NUM_CHANNELS, off);
  off += 2;
  buf.writeUInt32LE(SAMPLE_RATE, off);
  off += 4;
  buf.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8), off);
  off += 4;
  buf.writeUInt16LE(NUM_CHANNELS * (BITS_PER_SAMPLE / 8), off);
  off += 2;
  buf.writeUInt16LE(BITS_PER_SAMPLE, off);
  off += 2;

  // data sub-chunk
  buf.write("data", off);
  off += 4;
  buf.writeUInt32LE(dataBytes, off);
  off += 4;

  // PCM samples
  for (let i = 0; i < numSamples; i++) {
    const s = Math.round(clamp(floatSamples[i]) * MAX_AMP);
    buf.writeInt16LE(s, off);
    off += 2;
  }

  fs.writeFileSync(filePath, buf);
}

// -- Sound generators ---------------------------------------------------------
// Each returns a Float64Array of length NUM_SAMPLES with values in [-1,1].

function generateRain() {
  // Filtered white noise plus random "droplet" impulses
  const out = new Float64Array(NUM_SAMPLES);
  const lp = makeLowPass(0.7);
  for (let i = 0; i < NUM_SAMPLES; i++) {
    let s = lp(rand()) * 0.35;
    // occasional droplet (short impulse decaying quickly)
    if (Math.random() < 0.0008) {
      const dropLen = Math.floor(Math.random() * 600 + 200);
      const amp = Math.random() * 0.5 + 0.3;
      for (let d = 0; d < dropLen && i + d < NUM_SAMPLES; d++) {
        const env = Math.exp(-d / (dropLen * 0.2));
        out[i + d] += env * amp * rand();
      }
    }
    out[i] += s;
  }
  applyLoopFade(out, 4410);
  return out;
}

function generateForest() {
  // Very soft brown noise (integrated white noise low-passed)
  const out = new Float64Array(NUM_SAMPLES);
  let brown = 0;
  for (let i = 0; i < NUM_SAMPLES; i++) {
    brown += rand() * 0.02;
    brown *= 0.998; // leaky integrator
    out[i] = brown * 0.6;
  }
  applyLoopFade(out, 4410);
  return out;
}

function generateOcean() {
  // White noise modulated by a slow sine envelope to mimic waves
  const out = new Float64Array(NUM_SAMPLES);
  const lp = makeLowPass(0.85);
  const waveFreq = 0.15; // Hz - one wave every ~6-7 s
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    // Envelope: biased sine so it stays positive
    const env = 0.25 + 0.75 * Math.pow((Math.sin(2 * Math.PI * waveFreq * t) + 1) / 2, 2);
    out[i] = lp(rand()) * env * 0.5;
  }
  applyLoopFade(out, 8820);
  return out;
}

function generateFire() {
  // Brown noise base with random crackling pops
  const out = new Float64Array(NUM_SAMPLES);
  let brown = 0;
  const lp = makeLowPass(0.6);
  for (let i = 0; i < NUM_SAMPLES; i++) {
    brown += rand() * 0.015;
    brown *= 0.997;
    let s = lp(brown) * 0.3;

    // Random crackle
    if (Math.random() < 0.001) {
      const popLen = Math.floor(Math.random() * 300 + 50);
      const amp = Math.random() * 0.7 + 0.3;
      for (let p = 0; p < popLen && i + p < NUM_SAMPLES; p++) {
        const env = Math.exp(-p / (popLen * 0.15));
        out[i + p] += env * amp * rand();
      }
    }
    out[i] += s;
  }
  applyLoopFade(out, 4410);
  return out;
}

function generateCafe() {
  // Low brown noise with occasional volume bumps (murmur of conversation)
  const out = new Float64Array(NUM_SAMPLES);
  let brown = 0;
  const lp1 = makeLowPass(0.8);
  const lp2 = makeLowPass(0.92);
  for (let i = 0; i < NUM_SAMPLES; i++) {
    brown += rand() * 0.012;
    brown *= 0.999;
    let s = lp1(brown) * 0.25;

    // Occasional murmur bump
    if (Math.random() < 0.0003) {
      const bumpLen = Math.floor(Math.random() * 8000 + 4000);
      const amp = Math.random() * 0.3 + 0.15;
      for (let b = 0; b < bumpLen && i + b < NUM_SAMPLES; b++) {
        const env = Math.sin((Math.PI * b) / bumpLen); // smooth hump
        out[i + b] += env * amp * lp2(rand());
      }
    }
    out[i] += s;
  }
  applyLoopFade(out, 4410);
  return out;
}

function generateWind() {
  // Slowly varying filtered noise
  const out = new Float64Array(NUM_SAMPLES);
  const lp = makeLowPass(0.92);
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    // Slow modulation with two sine waves at different frequencies
    const mod =
      0.3 +
      0.35 * (Math.sin(2 * Math.PI * 0.1 * t) + 1) / 2 +
      0.35 * (Math.sin(2 * Math.PI * 0.07 * t + 1.3) + 1) / 2;
    out[i] = lp(rand()) * mod * 0.45;
  }
  applyLoopFade(out, 8820);
  return out;
}

function generateBirds() {
  // Quiet background with occasional short sine-wave chirps
  const out = new Float64Array(NUM_SAMPLES);
  const bgLp = makeLowPass(0.95);

  // Very quiet background rustle
  for (let i = 0; i < NUM_SAMPLES; i++) {
    out[i] = bgLp(rand()) * 0.05;
  }

  // Scatter chirps throughout
  const numChirps = 18 + Math.floor(Math.random() * 12);
  for (let c = 0; c < numChirps; c++) {
    const startSample = Math.floor(Math.random() * (NUM_SAMPLES - 8000));
    const chirpLen = Math.floor(Math.random() * 3000 + 800);
    const baseFreq = 1800 + Math.random() * 3000; // 1800-4800 Hz
    const freqSlide = (Math.random() - 0.5) * 2000; // slide up or down
    const amp = 0.15 + Math.random() * 0.25;

    for (let j = 0; j < chirpLen; j++) {
      const idx = startSample + j;
      if (idx >= NUM_SAMPLES) break;
      const progress = j / chirpLen;
      const env = Math.sin(Math.PI * progress); // smooth on/off
      const freq = baseFreq + freqSlide * progress;
      const t = j / SAMPLE_RATE;
      out[idx] += env * amp * Math.sin(2 * Math.PI * freq * t);
    }
  }

  applyLoopFade(out, 4410);
  return out;
}

function generateThunder() {
  // Low rumble (heavily filtered brown noise) with occasional loud bursts
  const out = new Float64Array(NUM_SAMPLES);
  let brown = 0;
  const lp = makeLowPass(0.96);

  for (let i = 0; i < NUM_SAMPLES; i++) {
    brown += rand() * 0.01;
    brown *= 0.999;
    out[i] = lp(brown) * 0.2;
  }

  // 2-4 thunder claps
  const numClaps = 2 + Math.floor(Math.random() * 3);
  for (let c = 0; c < numClaps; c++) {
    const startSample = Math.floor(Math.random() * (NUM_SAMPLES - 44100));
    const clapLen = Math.floor(Math.random() * 30000 + 20000);
    const amp = 0.5 + Math.random() * 0.4;
    const burstLp = makeLowPass(0.88);

    for (let j = 0; j < clapLen; j++) {
      const idx = startSample + j;
      if (idx >= NUM_SAMPLES) break;
      // Fast attack, slow decay
      const env =
        j < 800
          ? j / 800
          : Math.exp(-(j - 800) / (clapLen * 0.35));
      out[idx] += burstLp(rand()) * env * amp;
    }
  }

  applyLoopFade(out, 8820);
  return out;
}

// -- Loop-fade helper ---------------------------------------------------------
/** Cross-fade the start and end so the loop point is seamless. */
function applyLoopFade(samples, fadeLen) {
  for (let i = 0; i < fadeLen; i++) {
    const t = i / fadeLen;
    // Fade in at start
    samples[i] *= t;
    // Fade out at end
    samples[samples.length - 1 - i] *= t;
  }
}

// -- Main ---------------------------------------------------------------------
const sounds = [
  { name: "rain", gen: generateRain },
  { name: "forest", gen: generateForest },
  { name: "ocean", gen: generateOcean },
  { name: "fire", gen: generateFire },
  { name: "cafe", gen: generateCafe },
  { name: "wind", gen: generateWind },
  { name: "birds", gen: generateBirds },
  { name: "thunder", gen: generateThunder },
];

console.log("Generating " + sounds.length + " ambient sound files...");
console.log("  Format : WAV 16-bit PCM mono " + SAMPLE_RATE + " Hz");
console.log("  Duration: " + DURATION + " s (" + NUM_SAMPLES + " samples)");
console.log("  Output : " + OUTPUT_DIR + "\n");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const { name, gen } of sounds) {
  process.stdout.write("  " + name + ".wav ... ");
  const samples = gen();
  const filePath = path.join(OUTPUT_DIR, name + ".wav");
  writeWav(filePath, samples);
  const stats = fs.statSync(filePath);
  console.log("OK  (" + (stats.size / 1024).toFixed(1) + " KB)");
}

console.log("\nDone. All files written successfully.");
