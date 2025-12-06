'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2, RefreshCw, Eraser } from 'lucide-react';
import {
  removeBackground,
  detectBackgroundColor,
  downloadWithoutBackground,
  DEFAULT_OPTIONS,
  type BackgroundRemovalOptions,
} from '@/lib/image-processing/background-removal';

interface BackgroundRemoverProps {
  imageSrc: string;
  originalFilename: string;
}

export function BackgroundRemover({ imageSrc, originalFilename }: BackgroundRemoverProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [detectedColor, setDetectedColor] = useState<string>('#ffffff');
  const [options, setOptions] = useState<BackgroundRemovalOptions>(DEFAULT_OPTIONS);

  // Detect background color when image changes
  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      try {
        const color = await detectBackgroundColor(imageSrc, options.tolerance);
        if (!cancelled) {
          setDetectedColor(color);
        }
      } catch (error) {
        console.error('Error detecting background color:', error);
      }
    };

    detect();

    return () => {
      cancelled = true;
    };
  }, [imageSrc, options.tolerance]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleProcess = useCallback(async () => {
    setIsProcessing(true);

    // Clean up previous preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    try {
      const blob = await removeBackground(imageSrc, {
        ...options,
        backgroundColor: options.autoDetect ? undefined : options.backgroundColor,
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error removing background:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [imageSrc, options, previewUrl]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const baseName = originalFilename.replace(/\.[^/.]+$/, '');
      await downloadWithoutBackground(
        imageSrc,
        `${baseName}-no-bg.png`,
        {
          ...options,
          backgroundColor: options.autoDetect ? undefined : options.backgroundColor,
        }
      );
    } catch (error) {
      console.error('Error downloading:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [imageSrc, originalFilename, options]);

  const handleToleranceChange = useCallback((value: number[]) => {
    setOptions(prev => ({ ...prev, tolerance: value[0] }));
  }, []);

  const handleFeatherChange = useCallback((value: number[]) => {
    setOptions(prev => ({ ...prev, feather: value[0] }));
  }, []);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions(prev => ({
      ...prev,
      backgroundColor: e.target.value,
      autoDetect: false,
    }));
  }, []);

  const handleAutoDetect = useCallback(() => {
    setOptions(prev => ({ ...prev, autoDetect: true }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Remove solid color backgrounds from logos and icons using color-based detection.
          Works best with images that have uniform background colors.
        </p>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        {/* Tolerance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Color Tolerance</Label>
            <span className="text-sm text-muted-foreground">{options.tolerance}</span>
          </div>
          <Slider
            value={[options.tolerance]}
            min={1}
            max={100}
            step={1}
            onValueChange={handleToleranceChange}
          />
          <p className="text-xs text-muted-foreground">
            Higher values remove more similar colors. Lower values are more precise.
          </p>
        </div>

        {/* Feather */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Edge Softness</Label>
            <span className="text-sm text-muted-foreground">{options.feather}</span>
          </div>
          <Slider
            value={[options.feather]}
            min={0}
            max={5}
            step={0.5}
            onValueChange={handleFeatherChange}
          />
          <p className="text-xs text-muted-foreground">
            Softens edges for smoother transitions. 0 for hard edges.
          </p>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label>Background Color</Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="color"
                value={options.autoDetect ? detectedColor : (options.backgroundColor || detectedColor)}
                onChange={handleColorChange}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={options.autoDetect ? detectedColor : (options.backgroundColor || detectedColor)}
                onChange={handleColorChange}
                className="flex-1 font-mono"
                placeholder="#ffffff"
              />
            </div>
            <Button
              variant={options.autoDetect ? 'default' : 'outline'}
              size="sm"
              onClick={handleAutoDetect}
            >
              Auto
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {options.autoDetect
              ? `Auto-detected from corners: ${detectedColor}`
              : 'Manually selected color'}
          </p>
        </div>

        {/* Remove Enclosed Regions */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="removeEnclosed"
            checked={options.removeEnclosed}
            onCheckedChange={(checked) =>
              setOptions(prev => ({ ...prev, removeEnclosed: checked === true }))
            }
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="removeEnclosed"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remove enclosed regions
            </Label>
            <p className="text-xs text-muted-foreground">
              Also remove background inside letters (A, O, P, etc.)
            </p>
          </div>
        </div>
      </div>

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={isProcessing}
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
            <Eraser className="w-4 h-4 mr-2" />
            Remove Background
          </>
        )}
      </Button>

      {/* Preview */}
      {previewUrl && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Preview</Label>
          <Card className="p-4">
            {/* Checkerboard background to show transparency */}
            <div
              className="relative rounded overflow-hidden"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                  linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                  linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
                `,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            >
              <img
                src={previewUrl}
                alt="Preview with background removed"
                className="w-full h-auto max-h-64 object-contain"
              />
            </div>
          </Card>

          {/* Side by side comparison */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground text-center">Original</p>
              <Card className="p-2">
                <img
                  src={imageSrc}
                  alt="Original"
                  className="w-full h-20 object-contain"
                />
              </Card>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground text-center">Processed</p>
              <Card
                className="p-2"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
                  `,
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                }}
              >
                <img
                  src={previewUrl}
                  alt="Processed"
                  className="w-full h-20 object-contain"
                />
              </Card>
            </div>
          </div>

          {/* Download */}
          <div className="flex gap-2">
            <Button
              onClick={handleProcess}
              variant="outline"
              className="flex-1"
              disabled={isProcessing}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reprocess
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Tips */}
      <Card className="p-3 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          <strong>Tips:</strong> Works best with logos on solid color backgrounds.
          Enable &quot;Remove enclosed regions&quot; for text logos with letters like A, O, P, D, R, etc.
          Adjust tolerance if too much or too little is being removed.
        </p>
      </Card>
    </div>
  );
}
