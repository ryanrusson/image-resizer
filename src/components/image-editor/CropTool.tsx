'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Square, Circle, RectangleHorizontal, RotateCcw, ZoomIn } from 'lucide-react';
import type { CropShape, CropArea } from '@/types';
import { ASPECT_RATIOS } from '@/lib/presets';
import { cn } from '@/lib/utils';

interface CropToolProps {
  imageSrc: string;
  onCropComplete: (
    area: CropArea,
    areaPixels: CropArea,
    shape: CropShape,
    rotation: number
  ) => void;
  initialShape?: CropShape;
  initialAspect?: number;
}

export function CropTool({
  imageSrc,
  onCropComplete,
  initialShape = 'rect',
  initialAspect,
}: CropToolProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [shape, setShape] = useState<CropShape>(initialShape);
  const [aspect, setAspect] = useState<number | undefined>(initialAspect);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      onCropComplete(
        _croppedArea,
        croppedAreaPixels,
        shape,
        rotation
      );
    },
    [onCropComplete, shape, rotation]
  );

  const handleShapeChange = (newShape: CropShape) => {
    setShape(newShape);
    // Force 1:1 aspect ratio for circle
    if (newShape === 'circle') {
      setAspect(1);
    }
  };

  const handleAspectChange = (value: string) => {
    const newAspect = value === 'free' ? undefined : parseFloat(value);
    setAspect(newAspect);
    // If setting a 1:1 aspect, suggest circle shape
    if (newAspect === 1 && shape === 'rect') {
      // Keep rect, user can switch to circle if they want
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="space-y-4">
      {/* Crop canvas */}
      <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          cropShape={shape === 'circle' || shape === 'oval' ? 'round' : 'rect'}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={handleCropComplete}
          showGrid={shape === 'rect'}
        />
      </div>

      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Shape selection */}
        <div className="space-y-2">
          <Label>Shape</Label>
          <div className="flex gap-2">
            <Button
              variant={shape === 'rect' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleShapeChange('rect')}
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-2" />
              Rectangle
            </Button>
            <Button
              variant={shape === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleShapeChange('circle')}
              className="flex-1"
            >
              <Circle className="w-4 h-4 mr-2" />
              Circle
            </Button>
            <Button
              variant={shape === 'oval' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleShapeChange('oval')}
              className="flex-1"
            >
              <RectangleHorizontal className="w-4 h-4 mr-2" />
              Oval
            </Button>
          </div>
        </div>

        {/* Aspect ratio */}
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select
            value={aspect?.toString() ?? 'free'}
            onValueChange={handleAspectChange}
            disabled={shape === 'circle'}
          >
            <SelectTrigger className={cn(shape === 'circle' && 'opacity-50')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIOS.map((ratio) => (
                <SelectItem
                  key={ratio.label}
                  value={ratio.value?.toString() ?? 'free'}
                >
                  {ratio.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {shape === 'circle' && (
            <p className="text-xs text-muted-foreground">
              Circle always uses 1:1 ratio
            </p>
          )}
        </div>
      </div>

      {/* Zoom and rotation sliders */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4" />
              Zoom
            </Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={([value]) => setZoom(value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Rotation
            </Label>
            <span className="text-sm text-muted-foreground">{rotation}°</span>
          </div>
          <Slider
            value={[rotation]}
            min={-180}
            max={180}
            step={1}
            onValueChange={([value]) => setRotation(value)}
          />
        </div>
      </div>

      {/* Reset button */}
      <Button variant="outline" size="sm" onClick={resetCrop} className="w-full">
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset Crop
      </Button>
    </div>
  );
}
