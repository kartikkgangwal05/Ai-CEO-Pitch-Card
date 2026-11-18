// Person cutout in the browser with MediaPipe's selfie segmenter.
// Runtime (wasm) and model are served locally from /mediapipe and /models, so the booth works offline.
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

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
      return await create('GPU').catch(() => create('CPU'));
    } catch (err) {
      console.warn('[segment] person cutout unavailable:', err);
      return null;
    }
  })();
  return segmenterPromise;
}

/** Warm the model up early (e.g. when the booth opens) so the first scan is fast. */
export function preloadSegmenter() {
  void getSegmenter();
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
