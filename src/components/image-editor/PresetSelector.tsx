'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Circle, Square, Check } from 'lucide-react';
import {
  FaXTwitter,
  FaLinkedinIn,
  FaGithub,
  FaSlack,
  FaDiscord,
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaWhatsapp,
  FaTiktok,
} from 'react-icons/fa6';
import type { AvatarPreset } from '@/types';
import { AVATAR_PRESETS } from '@/lib/presets';
import { cn } from '@/lib/utils';
import type { IconType } from 'react-icons';

interface PresetSelectorProps {
  selectedPreset: AvatarPreset | null;
  onPresetSelect: (preset: AvatarPreset) => void;
  onClear: () => void;
}

const platformIcons: Record<string, IconType> = {
  'Twitter/X': FaXTwitter,
  'LinkedIn': FaLinkedinIn,
  'GitHub': FaGithub,
  'Slack': FaSlack,
  'Discord': FaDiscord,
  'Instagram': FaInstagram,
  'Facebook': FaFacebookF,
  'YouTube': FaYoutube,
  'WhatsApp': FaWhatsapp,
  'TikTok': FaTiktok,
};

const platformColors: Record<string, string> = {
  'Twitter/X': 'bg-black text-white',
  'LinkedIn': 'bg-[#0A66C2] text-white',
  'GitHub': 'bg-[#181717] text-white',
  'Slack': 'bg-[#4A154B] text-white',
  'Discord': 'bg-[#5865F2] text-white',
  'Instagram': 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white',
  'Facebook': 'bg-[#1877F2] text-white',
  'YouTube': 'bg-[#FF0000] text-white',
  'WhatsApp': 'bg-[#25D366] text-white',
  'TikTok': 'bg-black text-white',
};

export function PresetSelector({
  selectedPreset,
  onPresetSelect,
  onClear,
}: PresetSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Quick presets for common social media platforms
        </p>
        {selectedPreset && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {AVATAR_PRESETS.map((preset) => {
          const isSelected = selectedPreset?.id === preset.id;
          const Icon = platformIcons[preset.platform];
          return (
            <Card
              key={preset.id}
              className={cn(
                'relative p-3 cursor-pointer transition-all hover:scale-105',
                'hover:shadow-md',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => onPresetSelect(preset)}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 p-1 bg-primary rounded-full">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}

              <div className="flex flex-col items-center gap-2 text-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    platformColors[preset.platform] || 'bg-gray-500 text-white'
                  )}
                >
                  {Icon ? (
                    <Icon className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-bold">
                      {preset.platform.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium truncate">{preset.platform}</p>
                  <p className="text-xs text-muted-foreground">{preset.name}</p>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {preset.shape === 'circle' ? (
                    <Circle className="w-3 h-3" />
                  ) : (
                    <Square className="w-3 h-3" />
                  )}
                  <span>
                    {preset.width}x{preset.height}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedPreset && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm">
            <span className="font-medium">{selectedPreset.platform}</span>
            {' - '}
            {selectedPreset.width}x{selectedPreset.height}px{' '}
            {selectedPreset.shape === 'circle' ? 'circle' : 'square'}
          </p>
        </div>
      )}
    </div>
  );
}
