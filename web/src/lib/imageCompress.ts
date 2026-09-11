/** Firestore data-URI limitleri (mobil ile aynı) */
export const FIRESTORE_PHOTO_BYTES = 550_000;
export const FIRESTORE_COVER_BYTES = 120_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Görsel okunamadı'));
    };
    img.src = url;
  });
}

/** Dosyayı JPEG data-URI’ye sıkıştır (maxBytes / maxEdge). */
export async function compressFileToJpegDataUri(
  file: File,
  maxBytes: number,
  maxEdge: number,
): Promise<string> {
  const img = await loadImage(file);
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas desteklenmiyor');
  ctx.drawImage(img, 0, 0, w, h);

  let quality = 0.85;
  let dataUri = canvas.toDataURL('image/jpeg', quality);
  while (dataUri.length > maxBytes * 1.37 && quality > 0.35) {
    quality -= 0.1;
    dataUri = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUri.length > maxBytes * 1.37) {
    const shrink = 0.75;
    canvas.width = Math.max(1, Math.round(w * shrink));
    canvas.height = Math.max(1, Math.round(h * shrink));
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    dataUri = canvas.toDataURL('image/jpeg', 0.7);
  }
  return dataUri;
}
