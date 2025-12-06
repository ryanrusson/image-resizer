'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadBlob, generateFilename } from '@/lib/image-processing/download';
import { getCroppedImage } from '@/lib/image-processing/crop';
import { resizeImage } from '@/lib/image-processing/compress';
import type { CropArea, CropShape, CompressionSettings, AvatarPreset } from '@/types';

interface DownloadButtonProps {
  imageSrc: string;
  originalFilename: string;
  cropArea: CropArea | null;
  cropShape: CropShape;
  rotation: number;
  compressionSettings: CompressionSettings;
  selectedPreset: AvatarPreset | null;
  disabled?: boolean;
}

export function DownloadButton({
  imageSrc,
  originalFilename,
  cropArea,
  cropShape,
  rotation,
  compressionSettings,
  selectedPreset,
  disabled,
}: DownloadButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async () => {
    if (!cropArea) return;

    setIsProcessing(true);
    try {
      // Step 1: Crop the image with shape mask
      const croppedBlob = await getCroppedImage(
        imageSrc,
        cropArea,
        rotation,
        cropShape
      );

      // Step 2: Determine target dimensions
      let targetWidth = compressionSettings.maxWidth;
      let targetHeight = compressionSettings.maxHeight;

      if (selectedPreset) {
        targetWidth = selectedPreset.width;
        targetHeight = selectedPreset.height;
      }

      // Step 3: Resize and compress
      const finalBlob = await resizeImage(
        croppedBlob,
        targetWidth,
        targetHeight,
        compressionSettings.format,
        compressionSettings.quality / 100
      );

      // Step 4: Download
      const filename = generateFilename(
        originalFilename,
        selectedPreset?.id || null,
        compressionSettings.format
      );
      downloadBlob(finalBlob, filename);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || !cropArea || isProcessing}
      className="w-full"
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download Image
        </>
      )}
    </Button>
  );
}
