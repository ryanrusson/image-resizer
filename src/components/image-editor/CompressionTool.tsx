'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Gauge, Maximize2, Lock, Unlock } from 'lucide-react';
import type { CompressionSettings } from '@/types';
import { OUTPUT_FORMATS } from '@/lib/presets';
import { cn } from '@/lib/utils';

interface CompressionToolProps {
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
  originalSize?: number;
}

export function CompressionTool({
  settings,
  onSettingsChange,
  originalSize,
}: CompressionToolProps) {
  const [aspectLocked, setAspectLocked] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(
    settings.maxWidth / settings.maxHeight
  );

  // Compute current aspect ratio from settings for display
  const currentAspectRatio = aspectLocked ? aspectRatio : settings.maxWidth / settings.maxHeight;

  const handleQualityChange = (value: number[]) => {
    onSettingsChange({ ...settings, quality: value[0] });
  };

  const handleWidthChange = (newWidth: number) => {
    const clampedWidth = Math.max(50, Math.min(4000, newWidth));
    if (aspectLocked) {
      const newHeight = Math.round(clampedWidth / aspectRatio);
      onSettingsChange({
        ...settings,
        maxWidth: clampedWidth,
        maxHeight: Math.max(50, Math.min(4000, newHeight)),
      });
    } else {
      onSettingsChange({ ...settings, maxWidth: clampedWidth });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    const clampedHeight = Math.max(50, Math.min(4000, newHeight));
    if (aspectLocked) {
      const newWidth = Math.round(clampedHeight * aspectRatio);
      onSettingsChange({
        ...settings,
        maxWidth: Math.max(50, Math.min(4000, newWidth)),
        maxHeight: clampedHeight,
      });
    } else {
      onSettingsChange({ ...settings, maxHeight: clampedHeight });
    }
  };

  const handleWidthSliderChange = (value: number[]) => {
    handleWidthChange(value[0]);
  };

  const handleHeightSliderChange = (value: number[]) => {
    handleHeightChange(value[0]);
  };

  const handleWidthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleWidthChange(value);
    }
  };

  const handleHeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleHeightChange(value);
    }
  };

  const toggleAspectLock = () => {
    if (!aspectLocked) {
      // When locking, capture current aspect ratio
      setAspectRatio(settings.maxWidth / settings.maxHeight);
    }
    setAspectLocked(!aspectLocked);
  };

  const handleFormatChange = (value: string) => {
    onSettingsChange({
      ...settings,
      format: value as CompressionSettings['format'],
    });
  };

  return (
    <div className="space-y-6">
      {/* Quality slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Quality
          </Label>
          <span className="text-sm font-medium">{settings.quality}%</span>
        </div>
        <Slider
          value={[settings.quality]}
          min={10}
          max={100}
          step={1}
          onValueChange={handleQualityChange}
        />
        <p className="text-xs text-muted-foreground">
          Lower quality = smaller file size. 80-90% is usually a good balance.
        </p>
      </div>

      {/* Max dimensions with lock */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            Max Dimensions
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAspectLock}
            className={cn(
              'h-8 px-2',
              aspectLocked && 'text-primary'
            )}
          >
            {aspectLocked ? (
              <Lock className="w-4 h-4 mr-1" />
            ) : (
              <Unlock className="w-4 h-4 mr-1" />
            )}
            {aspectLocked ? 'Locked' : 'Unlocked'}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Width */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-12">Width</Label>
              <Input
                type="number"
                value={settings.maxWidth}
                onChange={handleWidthInputChange}
                min={50}
                max={4000}
                className="h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <Slider
              value={[settings.maxWidth]}
              min={50}
              max={4000}
              step={10}
              onValueChange={handleWidthSliderChange}
            />
          </div>

          {/* Height */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-12">Height</Label>
              <Input
                type="number"
                value={settings.maxHeight}
                onChange={handleHeightInputChange}
                min={50}
                max={4000}
                className="h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <Slider
              value={[settings.maxHeight]}
              min={50}
              max={4000}
              step={10}
              onValueChange={handleHeightSliderChange}
            />
          </div>
        </div>

        {aspectLocked && (
          <p className="text-xs text-muted-foreground">
            Aspect ratio locked at {currentAspectRatio.toFixed(2)}:1
          </p>
        )}
      </div>

      {/* Output format */}
      <div className="space-y-2">
        <Label>Output Format</Label>
        <Select value={settings.format} onValueChange={handleFormatChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OUTPUT_FORMATS.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          JPEG is best for photos. PNG preserves transparency. WebP offers the best compression.
        </p>
      </div>

      {/* Original size info */}
      {originalSize && (
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <span className="text-muted-foreground">Original size: </span>
          <span className="font-medium">
            {(originalSize / 1024).toFixed(1)} KB
          </span>
        </div>
      )}
    </div>
  );
}
