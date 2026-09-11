import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

/** UI / genel üst sınır (Storage açılınca da geçerli) */
export const MAX_PHOTO_BYTES = 1024 * 1024;

/**
 * Firestore tek doküman ~1 MB.
 * Base64 şişer (~%33); güvenli binary üst sınır.
 */
export const FIRESTORE_PHOTO_BYTES = 550 * 1024;
export const FIRESTORE_COVER_BYTES = 120 * 1024;

async function fileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && 'size' in info && typeof info.size === 'number') {
    return info.size;
  }
  return 0;
}

export async function compressImageUnderBytes(
  uri: string,
  maxBytes: number,
  startWidth = 1600,
): Promise<{ uri: string; size: number }> {
  let width = startWidth;
  let quality = 0.72;
  let current = uri;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await ImageManipulator.manipulateAsync(
      current,
      [{ resize: { width } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
    const size = await fileSize(result.uri);
    if (size > 0 && size <= maxBytes) {
      return { uri: result.uri, size };
    }
    quality = Math.max(0.28, quality - 0.1);
    width = Math.max(480, Math.floor(width * 0.8));
    current = result.uri;
  }

  throw new Error(
    `Fotoğraf ${(maxBytes / 1024).toFixed(0)} KB altına düşürülemedi. Başka görsel dene.`,
  );
}

export function compressImageUnder1MB(uri: string) {
  return compressImageUnderBytes(uri, MAX_PHOTO_BYTES);
}

export async function uriToJpegDataUri(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
