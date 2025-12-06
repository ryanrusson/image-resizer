export interface FaviconSize {
  size: number;
  label: string;
  description: string;
}

export const FAVICON_SIZES: FaviconSize[] = [
  { size: 16, label: '16x16', description: 'Browser tab' },
  { size: 32, label: '32x32', description: 'Browser tab (Retina)' },
  { size: 48, label: '48x48', description: 'Windows taskbar' },
];

export const ADDITIONAL_SIZES: FaviconSize[] = [
  { size: 180, label: '180x180', description: 'Apple Touch Icon' },
  { size: 192, label: '192x192', description: 'Android/PWA' },
  { size: 512, label: '512x512', description: 'PWA Splash' },
];

/**
 * Resize an image to a specific square size
 */
async function resizeToSize(
  imageSrc: string,
  size: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use high-quality rendering for larger sizes,
      // but for very small sizes keep it crisp
      if (size <= 32) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
      } else {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      ctx.drawImage(img, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}

/**
 * Generate PNG blobs at multiple favicon sizes
 */
export async function generateFaviconSizes(
  imageSrc: string,
  sizes: number[] = FAVICON_SIZES.map((s) => s.size)
): Promise<Map<number, Blob>> {
  const results = new Map<number, Blob>();

  for (const size of sizes) {
    const blob = await resizeToSize(imageSrc, size);
    results.set(size, blob);
  }

  return results;
}

/**
 * Create an ICO file from multiple PNG blobs (pure browser implementation)
 * ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
export async function createIcoFile(
  pngBlobs: Map<number, Blob>
): Promise<Blob> {
  // Sort by size (smallest first) for ICO format
  const sortedSizes = Array.from(pngBlobs.keys()).sort((a, b) => a - b);
  const imageCount = sortedSizes.length;

  // Read all PNG data
  const pngDataArray: { size: number; data: Uint8Array }[] = [];
  for (const size of sortedSizes) {
    const blob = pngBlobs.get(size);
    if (blob) {
      const arrayBuffer = await blob.arrayBuffer();
      pngDataArray.push({ size, data: new Uint8Array(arrayBuffer) });
    }
  }

  // ICO Header: 6 bytes
  // - Reserved: 2 bytes (always 0)
  // - Type: 2 bytes (1 for ICO)
  // - Image count: 2 bytes
  const headerSize = 6;

  // Directory entry: 16 bytes each
  // - Width: 1 byte (0 = 256)
  // - Height: 1 byte (0 = 256)
  // - Color palette: 1 byte (0 for no palette)
  // - Reserved: 1 byte (always 0)
  // - Color planes: 2 bytes (1 for ICO)
  // - Bits per pixel: 2 bytes (32 for PNG with alpha)
  // - Image data size: 4 bytes
  // - Image data offset: 4 bytes
  const directoryEntrySize = 16;
  const directorySize = directoryEntrySize * imageCount;

  // Calculate total size
  const totalPngSize = pngDataArray.reduce((sum, img) => sum + img.data.length, 0);
  const totalSize = headerSize + directorySize + totalPngSize;

  // Create the ICO file buffer
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  // Write ICO header
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type: 1 = ICO
  view.setUint16(4, imageCount, true); // Image count

  // Write directory entries and image data
  let currentOffset = headerSize + directorySize;

  pngDataArray.forEach((img, index) => {
    const entryOffset = headerSize + index * directoryEntrySize;

    // Width (0 = 256)
    view.setUint8(entryOffset, img.size >= 256 ? 0 : img.size);
    // Height (0 = 256)
    view.setUint8(entryOffset + 1, img.size >= 256 ? 0 : img.size);
    // Color palette (0 for truecolor/PNG)
    view.setUint8(entryOffset + 2, 0);
    // Reserved
    view.setUint8(entryOffset + 3, 0);
    // Color planes (1)
    view.setUint16(entryOffset + 4, 1, true);
    // Bits per pixel (32 for PNG with alpha)
    view.setUint16(entryOffset + 6, 32, true);
    // Image data size
    view.setUint32(entryOffset + 8, img.data.length, true);
    // Image data offset
    view.setUint32(entryOffset + 12, currentOffset, true);

    // Copy PNG data
    uint8View.set(img.data, currentOffset);
    currentOffset += img.data.length;
  });

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Generate and download a favicon.ico file
 */
export async function downloadFavicon(
  imageSrc: string,
  filename: string = 'favicon.ico'
): Promise<void> {
  // Generate all standard favicon sizes
  const sizes = FAVICON_SIZES.map((s) => s.size);
  const pngBlobs = await generateFaviconSizes(imageSrc, sizes);

  // Create ICO file
  const icoBlob = await createIcoFile(pngBlobs);

  // Trigger download
  const url = URL.createObjectURL(icoBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Download a single PNG at a specific size
 */
export async function downloadPngSize(
  imageSrc: string,
  size: number,
  filename?: string
): Promise<void> {
  const blob = await resizeToSize(imageSrc, size);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `icon-${size}x${size}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generate a preview URL for a specific size
 */
export async function generatePreviewUrl(
  imageSrc: string,
  size: number
): Promise<string> {
  const blob = await resizeToSize(imageSrc, size);
  return URL.createObjectURL(blob);
}
