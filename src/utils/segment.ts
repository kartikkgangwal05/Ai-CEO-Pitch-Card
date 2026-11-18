// Person cutout in the browser with MediaPipe's selfie segmenter.
// Runtime (wasm) and model are served locally from /mediapipe and /models, so the booth works offline.
import { FilesetResolver, ImageSegmenter, PoseLandmarker } from '@mediapipe/tasks-vision';

let segmenterPromise: Promise<ImageSegmenter | null> | null = null;

function getSegmenter(): Promise<ImageSegmenter | null> {
  segmenterPromise ??= (async () => {
    try {
      const fileset = await FilesetResolver.forVisionTasks('/mediapipe');
      const create = (delegate: 'GPU' | 'CPU') =>
        ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: '/models/selfie_segmenter.tflite', delegate },
          runningMode: 'IMAGE',
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        });
      // Some machines (no WebGL, bad drivers) hang instead of failing on GPU: give it 4s, then use CPU.
      const gpu = Promise.race([
        create('GPU'),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPU delegate timed out')), 4000)),
      ]);
      return await gpu.catch(() => create('CPU'));
    } catch (err) {
      console.warn('[segment] person cutout unavailable:', err);
      return null;
    }
  })();
  return segmenterPromise;
}

let posePromise: Promise<PoseLandmarker | null> | null = null;

function getPose(): Promise<PoseLandmarker | null> {
  posePromise ??= (async () => {
    try {
      const fileset = await FilesetResolver.forVisionTasks('/mediapipe');
      const create = (delegate: 'GPU' | 'CPU') =>
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate },
          runningMode: 'IMAGE',
          numPoses: 1,
        });
      const gpu = Promise.race([
        create('GPU'),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPU delegate timed out')), 4000)),
      ]);
      return await gpu.catch(() => create('CPU'));
    } catch (err) {
      console.warn('[pose] landmarks unavailable:', err);
      return null;
    }
  })();
  return posePromise;
}

/** Warm the models up early (e.g. when the booth opens) so the first scan is fast. */
export function preloadSegmenter() {
  void getSegmenter();
  void getPose();
}

export interface Pt {
  x: number;
  y: number;
}

/**
 * Key upper-body points in canvas pixels (shoulders, ears, nose, mouth corners), or null.
 * visL / visR are the pose model's visibility scores (0..1) for the left / right shoulder.
 */
export interface UpperBody {
  nose: Pt;
  mouthL: Pt;
  mouthR: Pt;
  earL: Pt;
  earR: Pt;
  shoulderL: Pt;
  shoulderR: Pt;
  visL: number;
  visR: number;
}

export async function upperBody(source: HTMLCanvasElement): Promise<UpperBody | null> {
  const pose = await getPose();
  if (!pose) return null;
  try {
    const lm = pose.detect(source).landmarks?.[0];
    if (!lm || lm.length < 13) return null;
    const p = (i: number): Pt => ({ x: lm[i].x * source.width, y: lm[i].y * source.height });
    return {
      nose: p(0),
      mouthL: p(9),
      mouthR: p(10),
      earL: p(7),
      earR: p(8),
      shoulderL: p(11),
      shoulderR: p(12),
      visL: lm[11].visibility ?? 1,
      visR: lm[12].visibility ?? 1,
    };
  } catch (err) {
    console.warn('[pose] failed:', err);
    return null;
  }
}

/**
 * Returns a canvas the size of `source` whose alpha is the person mask (white where the person is),
 * or null if segmentation isn't available. Edges are softened slightly.
 */
export async function personMask(source: HTMLCanvasElement): Promise<HTMLCanvasElement | null> {
  const segmenter = await getSegmenter();
  if (!segmenter) return null;
  try {
    const result = segmenter.segment(source);
    const mask = result.confidenceMasks?.[0];
    if (!mask) return null;
    const mw = mask.width;
    const mh = mask.height;
    const values = mask.getAsFloat32Array();
    const small = document.createElement('canvas');
    small.width = mw;
    small.height = mh;
    const sctx = small.getContext('2d')!;
    const img = sctx.createImageData(mw, mh);
    for (let i = 0; i < values.length; i++) {
      // Smoothstep the confidence so hair edges stay soft but the background drops out cleanly.
      const t = Math.min(1, Math.max(0, (values[i] - 0.25) / 0.5));
      const a = t * t * (3 - 2 * t);
      img.data[i * 4] = 255;
      img.data[i * 4 + 1] = 255;
      img.data[i * 4 + 2] = 255;
      img.data[i * 4 + 3] = Math.round(a * 255);
    }
    sctx.putImageData(img, 0, 0);
    result.close();
    const out = document.createElement('canvas');
    out.width = source.width;
    out.height = source.height;
    const octx = out.getContext('2d')!;
    octx.filter = 'blur(1.5px)';
    octx.drawImage(small, 0, 0, out.width, out.height);
    return out;
  } catch (err) {
    console.warn('[segment] failed:', err);
    return null;
  }
}
