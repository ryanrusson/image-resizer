'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ImageUploader,
  CropTool,
  CompressionTool,
  PresetSelector,
  DownloadButton,
  FaviconTool,
  BackgroundRemover,
} from '@/components/image-editor';
import { Crop, Settings2, LayoutGrid, X, Shield, ImageIcon, Eraser } from 'lucide-react';
import type {
  ImageFile,
  CropArea,
  CropShape,
  CompressionSettings,
  AvatarPreset,
} from '@/types';
import { getImageDimensions } from '@/lib/image-processing/crop';

const DEFAULT_COMPRESSION: CompressionSettings = {
  quality: 85,
  maxWidth: 1000,
  maxHeight: 1000,
  format: 'image/png',
};

export default function Home() {
  const [image, setImage] = useState<ImageFile | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [cropShape, setCropShape] = useState<CropShape>('rect');
  const [rotation, setRotation] = useState(0);
  const [compressionSettings, setCompressionSettings] =
    useState<CompressionSettings>(DEFAULT_COMPRESSION);
  const [selectedPreset, setSelectedPreset] = useState<AvatarPreset | null>(null);

  // Cleanup blob URLs on unmount or image change
  useEffect(() => {
    return () => {
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
    };
  }, [image?.preview]);

  const handleImageSelect = useCallback(async (file: File, preview: string) => {
    try {
      const { width, height } = await getImageDimensions(file);
      setImage({ file, preview, width, height });
      setCropArea(null);
      setSelectedPreset(null);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }, []);

  const handleCropComplete = useCallback(
    (
      _area: CropArea,
      areaPixels: CropArea,
      shape: CropShape,
      rot: number
    ) => {
      setCropArea(areaPixels);
      setCropShape(shape);
      setRotation(rot);
    },
    []
  );

  const handlePresetSelect = useCallback((preset: AvatarPreset) => {
    setSelectedPreset(preset);
    setCropShape(preset.shape === 'circle' ? 'circle' : 'rect');
    setCompressionSettings((prev) => ({
      ...prev,
      maxWidth: preset.width,
      maxHeight: preset.height,
    }));
  }, []);

  const handleClearPreset = useCallback(() => {
    setSelectedPreset(null);
  }, []);

  const handleReset = useCallback(() => {
    if (image) {
      URL.revokeObjectURL(image.preview);
    }
    setImage(null);
    setCropArea(null);
    setCropShape('rect');
    setRotation(0);
    setCompressionSettings(DEFAULT_COMPRESSION);
    setSelectedPreset(null);
  }, [image]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/image-resizer-logo-no-bg.png`}
                alt="Image Resizer"
                width={360}
                height={100}
                className="h-20 w-auto"
              />
              <p className="text-sm text-muted-foreground hidden sm:block">
                Crop, resize, and compress images in your browser
              </p>
            </div>
            {image && (
              <Button variant="outline" onClick={handleReset}>
                <X className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {!image ? (
          <div className="max-w-2xl mx-auto">
            <ImageUploader onImageSelect={handleImageSelect} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
            {/* Left column: Crop tool */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crop className="w-5 h-5" />
                  Crop & Adjust
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CropTool
                  imageSrc={image.preview}
                  onCropComplete={handleCropComplete}
                  initialShape={cropShape}
                  initialAspect={selectedPreset ? 1 : undefined}
                />
              </CardContent>
            </Card>

            {/* Right column: Settings and download */}
            <div className="space-y-6">
              <Tabs defaultValue="presets" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="presets" className="flex items-center gap-1 text-xs px-2">
                    <LayoutGrid className="w-3 h-3" />
                    Presets
                  </TabsTrigger>
                  <TabsTrigger value="favicon" className="flex items-center gap-1 text-xs px-2">
                    <ImageIcon className="w-3 h-3" />
                    Favicon
                  </TabsTrigger>
                  <TabsTrigger value="bgremove" className="flex items-center gap-1 text-xs px-2">
                    <Eraser className="w-3 h-3" />
                    Remove BG
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-1 text-xs px-2">
                    <Settings2 className="w-3 h-3" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Avatar Presets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PresetSelector
                        selectedPreset={selectedPreset}
                        onPresetSelect={handlePresetSelect}
                        onClear={handleClearPreset}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="favicon" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Favicon Generator</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FaviconTool
                        imageSrc={image.preview}
                        originalFilename={image.file.name}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bgremove" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Background Removal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BackgroundRemover
                        imageSrc={image.preview}
                        originalFilename={image.file.name}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Compression Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CompressionTool
                        settings={compressionSettings}
                        onSettingsChange={setCompressionSettings}
                        originalSize={image.file.size}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Image info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Original: </span>
                      {image.width} x {image.height}px
                    </p>
                    {cropArea && (
                      <p>
                        <span className="text-muted-foreground">Crop: </span>
                        {Math.round(cropArea.width)} x {Math.round(cropArea.height)}px
                      </p>
                    )}
                    {selectedPreset && (
                      <p>
                        <span className="text-muted-foreground">Output: </span>
                        {selectedPreset.width} x {selectedPreset.height}px
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Download button */}
              <DownloadButton
                imageSrc={image.preview}
                originalFilename={image.file.name}
                cropArea={cropArea}
                cropShape={cropShape}
                rotation={rotation}
                compressionSettings={compressionSettings}
                selectedPreset={selectedPreset}
              />
            </div>
          </div>
        )}
      </main>

      {/* Privacy footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <p>
              Privacy First: All image processing happens in your browser. Your images are never uploaded to any server.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
