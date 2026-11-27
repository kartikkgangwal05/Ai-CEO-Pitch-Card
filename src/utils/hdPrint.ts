import { PRINT_DPI, renderCardNodeToPng } from './cardExport';

/**
 * Prints the card in the app's print sheet as one ultra-HD image (2.5 x 3.5 in at 1200 dpi) instead of letting
 * the browser redraw the live card: no hairlines between layers, no gradient banding, the same look as the
 * download. Falls back to the normal browser print if the image cannot be made.
 */
let busy = false;

export async function printHd(): Promise<void> {
  if (busy) return;
  busy = true;
  const sheet = document.querySelector<HTMLElement>('.print-only-pokemon-pair');
  const card = sheet?.firstElementChild as HTMLElement | null | undefined;
  let url: string | null = null;
  try {
    if (!sheet || !card) throw new Error('no card');
    // The print sheet is hidden on screen; lay it out off-screen just long enough to draw it.
    const prev = sheet.getAttribute('style');
    sheet.setAttribute('style', 'display:block;position:fixed;left:-20000px;top:0;pointer-events:none;');
    let blob: Blob;
    try {
      blob = await renderCardNodeToPng(card, Math.round(2.5 * PRINT_DPI));
    } finally {
      if (prev === null) sheet.removeAttribute('style');
      else sheet.setAttribute('style', prev);
    }
    url = URL.createObjectURL(blob);
    const holder = document.createElement('div');
    holder.id = 'hd-print';
    const img = document.createElement('img');
    img.alt = '';
    img.src = url;
    holder.appendChild(img);
    document.body.appendChild(holder);
    await img.decode();
    document.documentElement.classList.add('hd-print');
    // Chrome and Safari block in print(); Firefox returns at once, so clean up when printing ends.
    const finished = new Promise<void>((resolve) => {
      window.addEventListener('afterprint', () => resolve(), { once: true });
      window.setTimeout(resolve, 60_000);
    });
    window.print();
    await finished;
    document.documentElement.classList.remove('hd-print');
    holder.remove();
  } catch {
    document.documentElement.classList.remove('hd-print');
    document.getElementById('hd-print')?.remove();
    window.print();
  } finally {
    if (url) URL.revokeObjectURL(url);
    busy = false;
  }
}
