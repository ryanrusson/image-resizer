/**
 * Background removal using classic computer vision techniques
 * No ML/AI - uses color-based segmentation and flood fill algorithms
 */

export interface BackgroundRemovalOptions {
  /** Color tolerance for background detection (0-255) */
  tolerance: number;
  /** Whether to detect background color from corners */
  autoDetect: boolean;
  /** Manual background color (hex) if not auto-detecting */
  backgroundColor?: string;
  /** Edge feathering amount (0-10) */
  feather: number;
  /** Whether to remove from all corners or just detect dominant */
  allCorners: boolean;
  /** Remove enclosed background regions (e.g., inside letters like A, O, P) */
  removeEnclosed: boolean;
}

export const DEFAULT_OPTIONS: BackgroundRemovalOptions = {
  tolerance: 30,
  autoDetect: true,
  feather: 1,
  allCorners: true,
  removeEnclosed: true,
};

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 255, g: 255, b: 255 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate color distance between two RGB colors
 * Uses weighted Euclidean distance (human eye is more sensitive to green)
 */
function colorDistance(c1: RGB, c2: RGB): number {
  const rMean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;

  // Weighted color distance formula (redmean)
  const rWeight = 2 + rMean / 256;
  const gWeight = 4;
  const bWeight = 2 + (255 - rMean) / 256;

  return Math.sqrt(rWeight * dr * dr + gWeight * dg * dg + bWeight * db * db);
}

/**
 * Get pixel color at position from ImageData
 */
function getPixel(data: Uint8ClampedArray, width: number, x: number, y: number): RGB {
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
  };
}

/**
 * Sample colors from the corners of the image to detect background
 */
function sampleCornerColors(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sampleSize: number = 5
): RGB[] {
  const colors: RGB[] = [];

  // Sample from each corner
  const corners = [
    { x: 0, y: 0 }, // top-left
    { x: width - 1, y: 0 }, // top-right
    { x: 0, y: height - 1 }, // bottom-left
    { x: width - 1, y: height - 1 }, // bottom-right
  ];

  for (const corner of corners) {
    for (let dx = 0; dx < sampleSize; dx++) {
      for (let dy = 0; dy < sampleSize; dy++) {
        const x = Math.min(Math.max(corner.x + (corner.x === 0 ? dx : -dx), 0), width - 1);
        const y = Math.min(Math.max(corner.y + (corner.y === 0 ? dy : -dy), 0), height - 1);
        colors.push(getPixel(data, width, x, y));
      }
    }
  }

  return colors;
}

/**
 * Find the most common color among sampled colors
 */
function findDominantColor(colors: RGB[], tolerance: number): RGB {
  if (colors.length === 0) {
    return { r: 255, g: 255, b: 255 };
  }

  // Group similar colors
  const groups: { color: RGB; count: number }[] = [];

  for (const color of colors) {
    let found = false;
    for (const group of groups) {
      if (colorDistance(color, group.color) < tolerance) {
        group.count++;
        found = true;
        break;
      }
    }
    if (!found) {
      groups.push({ color, count: 1 });
    }
  }

  // Return the most common color
  groups.sort((a, b) => b.count - a.count);
  return groups[0].color;
}

/**
 * Flood fill algorithm to mark connected background regions
 * Uses a scanline approach for efficiency
 */
function floodFillMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  backgroundColor: RGB,
  tolerance: number,
  startPoints: { x: number; y: number }[]
): Uint8Array {
  const mask = new Uint8Array(width * height); // 0 = foreground, 255 = background
  const visited = new Uint8Array(width * height);
  const maxDistance = tolerance * 2.5; // Scale tolerance to color distance

  const stack: { x: number; y: number }[] = [...startPoints];

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const pixel = getPixel(data, width, x, y);
    const distance = colorDistance(pixel, backgroundColor);

    if (distance <= maxDistance) {
      mask[idx] = 255; // Mark as background

      // Add neighbors to stack
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }
  }

  return mask;
}

/**
 * Find and mark enclosed background regions that weren't reached by edge flood fill.
 * These are regions matching the background color that are completely surrounded
 * by non-background pixels (like the hole in an "A" or "O").
 */
function findEnclosedRegions(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  existingMask: Uint8Array,
  backgroundColor: RGB,
  tolerance: number
): Uint8Array {
  const mask = new Uint8Array(existingMask);
  const maxDistance = tolerance * 2.5;

  // Find all pixels that match background color but weren't marked
  const potentialEnclosed: { x: number; y: number }[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      // Skip if already marked as background
      if (mask[idx] === 255) continue;

      const pixel = getPixel(data, width, x, y);
      const distance = colorDistance(pixel, backgroundColor);

      if (distance <= maxDistance) {
        potentialEnclosed.push({ x, y });
      }
    }
  }

  // For each potential enclosed pixel, check if its connected region
  // is fully enclosed (doesn't touch any image edge)
  const processed = new Uint8Array(width * height);

  for (const start of potentialEnclosed) {
    const startIdx = start.y * width + start.x;
    if (processed[startIdx] || mask[startIdx] === 255) continue;

    // Flood fill to find the connected region
    const region: number[] = [];
    const stack: { x: number; y: number }[] = [start];
    let touchesEdge = false;

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      if (x < 0 || x >= width || y < 0 || y >= height) {
        touchesEdge = true;
        continue;
      }

      const idx = y * width + x;
      if (processed[idx] || mask[idx] === 255) continue;

      const pixel = getPixel(data, width, x, y);
      const distance = colorDistance(pixel, backgroundColor);

      if (distance > maxDistance) continue;

      processed[idx] = 1;
      region.push(idx);

      // Check if this pixel touches the image edge
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        touchesEdge = true;
      }

      // Add neighbors
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    // If this region doesn't touch any edge, it's enclosed - mark it as background
    if (!touchesEdge && region.length > 0) {
      for (const idx of region) {
        mask[idx] = 255;
      }
    }
  }

  return mask;
}

/**
 * Apply feathering to the mask edges for smoother transitions
 */
function applyFeathering(
  mask: Uint8Array,
  width: number,
  height: number,
  featherAmount: number
): Uint8Array {
  if (featherAmount <= 0) return mask;

  const result = new Uint8Array(mask);
  const radius = Math.ceil(featherAmount);

  // Simple box blur for feathering
  for (let pass = 0; pass < featherAmount; pass++) {
    const temp = new Uint8Array(result);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;

        // Only process edge pixels
        if (result[idx] !== 0 && result[idx] !== 255) continue;

        let sum = 0;
        let count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += temp[ny * width + nx];
              count++;
            }
          }
        }

        result[idx] = Math.round(sum / count);
      }
    }
  }

  // Edge detection pass - only feather actual edges
  const edgeMask = new Uint8Array(mask.length);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const current = mask[idx];

      // Check if this is an edge pixel
      const neighbors = [
        mask[idx - 1],
        mask[idx + 1],
        mask[idx - width],
        mask[idx + width],
      ];

      const isEdge = neighbors.some(n => n !== current);
      if (isEdge) {
        edgeMask[idx] = 1;
      }
    }
  }

  // Apply graduated transparency at edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      if (mask[idx] === 0) continue; // Keep foreground solid

      // Find distance to nearest foreground pixel
      let minDist = featherAmount + 1;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (mask[ny * width + nx] === 0) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              minDist = Math.min(minDist, dist);
            }
          }
        }
      }

      if (minDist <= featherAmount) {
        // Gradual transition
        result[idx] = Math.round((minDist / featherAmount) * 255);
      }
    }
  }

  return result;
}

/**
 * Apply the mask to create transparent background
 */
function applyMask(
  imageData: ImageData,
  mask: Uint8Array
): ImageData {
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  for (let i = 0; i < mask.length; i++) {
    const alphaIdx = i * 4 + 3;
    // Invert mask: 255 in mask means background (transparent)
    // Multiply existing alpha with mask
    const maskValue = 255 - mask[i];
    result.data[alphaIdx] = Math.round((result.data[alphaIdx] * maskValue) / 255);
  }

  return result;
}

/**
 * Main function to remove background from an image
 */
export async function removeBackground(
  imageSrc: string,
  options: Partial<BackgroundRemovalOptions> = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Determine background color
      let backgroundColor: RGB;
      if (opts.autoDetect) {
        const cornerColors = sampleCornerColors(
          imageData.data,
          canvas.width,
          canvas.height
        );
        backgroundColor = findDominantColor(cornerColors, opts.tolerance);
      } else if (opts.backgroundColor) {
        backgroundColor = hexToRgb(opts.backgroundColor);
      } else {
        backgroundColor = { r: 255, g: 255, b: 255 };
      }

      // Define starting points for flood fill
      const startPoints: { x: number; y: number }[] = [];
      if (opts.allCorners) {
        // Start from all corners
        startPoints.push({ x: 0, y: 0 });
        startPoints.push({ x: canvas.width - 1, y: 0 });
        startPoints.push({ x: 0, y: canvas.height - 1 });
        startPoints.push({ x: canvas.width - 1, y: canvas.height - 1 });

        // Also add edge midpoints for better coverage
        startPoints.push({ x: Math.floor(canvas.width / 2), y: 0 });
        startPoints.push({ x: Math.floor(canvas.width / 2), y: canvas.height - 1 });
        startPoints.push({ x: 0, y: Math.floor(canvas.height / 2) });
        startPoints.push({ x: canvas.width - 1, y: Math.floor(canvas.height / 2) });
      } else {
        // Just top-left corner
        startPoints.push({ x: 0, y: 0 });
      }

      // Create background mask using flood fill
      let mask = floodFillMask(
        imageData.data,
        canvas.width,
        canvas.height,
        backgroundColor,
        opts.tolerance,
        startPoints
      );

      // Find and remove enclosed background regions (like holes in letters)
      if (opts.removeEnclosed) {
        mask = findEnclosedRegions(
          imageData.data,
          canvas.width,
          canvas.height,
          mask,
          backgroundColor,
          opts.tolerance
        );
      }

      // Apply feathering for smoother edges
      if (opts.feather > 0) {
        mask = applyFeathering(mask, canvas.width, canvas.height, opts.feather);
      }

      // Apply mask to create transparent background
      const resultData = applyMask(imageData, mask);

      // Put result back on canvas
      ctx.putImageData(resultData, 0, 0);

      // Convert to blob
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
 * Detect the background color of an image
 */
export async function detectBackgroundColor(
  imageSrc: string,
  tolerance: number = 30
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const cornerColors = sampleCornerColors(
        imageData.data,
        canvas.width,
        canvas.height
      );
      const dominant = findDominantColor(cornerColors, tolerance);

      resolve(rgbToHex(dominant.r, dominant.g, dominant.b));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}

/**
 * Generate a preview URL with background removed
 */
export async function generatePreviewUrl(
  imageSrc: string,
  options: Partial<BackgroundRemovalOptions> = {}
): Promise<string> {
  const blob = await removeBackground(imageSrc, options);
  return URL.createObjectURL(blob);
}

/**
 * Download image with background removed
 */
export async function downloadWithoutBackground(
  imageSrc: string,
  filename: string,
  options: Partial<BackgroundRemovalOptions> = {}
): Promise<void> {
  const blob = await removeBackground(imageSrc, options);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
}
