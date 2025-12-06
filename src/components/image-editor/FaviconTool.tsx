'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Download, Loader2, Image as ImageIcon, Monitor, Smartphone } from 'lucide-react';
import {
  FAVICON_SIZES,
  ADDITIONAL_SIZES,
  generatePreviewUrl,
  downloadFavicon,
  downloadPngSize,
} from '@/lib/image-processing/favicon';
import { cn } from '@/lib/utils';

interface FaviconToolProps {
  imageSrc: string;
  originalFilename: string;
}

interface PreviewUrls {
  [key: number]: string;
}

export function FaviconTool({ imageSrc, originalFilename }: FaviconToolProps) {
  const [previewUrls, setPreviewUrls] = useState<PreviewUrls>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(true);

  // Generate previews when image changes
  useEffect(() => {
    let cancelled = false;

    const generatePreviews = async () => {
      setIsLoadingPreviews(true);
      const urls: PreviewUrls = {};

      try {
        // Generate previews for all sizes
        const allSizes = [...FAVICON_SIZES, ...ADDITIONAL_SIZES];
        for (const { size } of allSizes) {
          if (cancelled) return;
          const url = await generatePreviewUrl(imageSrc, size);
          urls[size] = url;
        }

        if (!cancelled) {
          setPreviewUrls(urls);
        }
      } catch (error) {
        console.error('Error generating previews:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingPreviews(false);
        }
      }
    };

    generatePreviews();

    return () => {
      cancelled = true;
      // Cleanup old preview URLs
      Object.values(previewUrls).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  const handleDownloadIco = useCallback(async () => {
    setIsGenerating(true);
    try {
      const baseName = originalFilename.replace(/\.[^/.]+$/, '');
      await downloadFavicon(imageSrc, `${baseName}-favicon.ico`);
    } catch (error) {
      console.error('Error generating favicon:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [imageSrc, originalFilename]);

  const handleDownloadPng = useCallback(
    async (size: number) => {
      try {
        const baseName = originalFilename.replace(/\.[^/.]+$/, '');
        await downloadPngSize(imageSrc, size, `${baseName}-${size}x${size}.png`);
      } catch (error) {
        console.error('Error downloading PNG:', error);
      }
    },
    [imageSrc, originalFilename]
  );

  return (
    <div className="space-y-6">
      {/* Main ICO Download */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Favicon.ico</Label>
        <p className="text-sm text-muted-foreground">
          Generate a standard favicon.ico file containing 16x16, 32x32, and 48x48 sizes.
        </p>
        <Button
          onClick={handleDownloadIco}
          disabled={isGenerating || isLoadingPreviews}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download favicon.ico
            </>
          )}
        </Button>
      </div>

      {/* Preview Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Preview</Label>
        <p className="text-sm text-muted-foreground">
          See how your favicon will look at different sizes.
        </p>

        {isLoadingPreviews ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card className="p-4">
            {/* Browser Tab Mockup */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Monitor className="w-3 h-3" />
                Browser Tab Preview
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-t-lg px-3 py-2 max-w-[200px]">
                {previewUrls[16] ? (
                  <img
                    src={previewUrls[16]}
                    alt="16x16 preview"
                    className="w-4 h-4"
                    style={{ imageRendering: 'auto' }}
                  />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                <span className="text-xs truncate">Your Website</span>
              </div>
            </div>

            {/* Size Grid */}
            <div className="grid grid-cols-3 gap-4">
              {FAVICON_SIZES.map(({ size, label, description }) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'flex items-center justify-center bg-muted rounded border-2 border-dashed border-muted-foreground/25',
                      size === 16 && 'w-8 h-8',
                      size === 32 && 'w-12 h-12',
                      size === 48 && 'w-16 h-16'
                    )}
                  >
                    {previewUrls[size] ? (
                      <img
                        src={previewUrls[size]}
                        alt={`${label} preview`}
                        style={{
                          width: size,
                          height: size,
                          imageRendering: size <= 32 ? 'auto' : 'auto',
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Additional Sizes */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Additional Sizes (PNG)
        </Label>
        <p className="text-sm text-muted-foreground">
          Download individual PNGs for Apple Touch Icon and PWA.
        </p>

        <div className="grid gap-2">
          {ADDITIONAL_SIZES.map(({ size, label, description }) => (
            <Card
              key={size}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center gap-3">
                {previewUrls[size] ? (
                  <img
                    src={previewUrls[size]}
                    alt={`${label} preview`}
                    className="w-10 h-10 rounded"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPng(size)}
                disabled={isLoadingPreviews}
              >
                <Download className="w-3 h-3 mr-1" />
                PNG
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
