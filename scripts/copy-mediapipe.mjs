// Copies the MediaPipe vision wasm runtime into public/ so person cutout works offline at the booth.
import { cpSync, existsSync, mkdirSync } from 'node:fs';

const from = 'node_modules/@mediapipe/tasks-vision/wasm';
const to = 'public/mediapipe';
if (existsSync(from)) {
  mkdirSync(to, { recursive: true });
  for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) cpSync(`${from}/${f}`, `${to}/${f}`);
  console.log('[postinstall] MediaPipe wasm copied to public/mediapipe');
}
