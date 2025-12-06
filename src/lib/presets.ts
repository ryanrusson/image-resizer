import type { AvatarPreset } from '@/types';

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'twitter', name: 'Profile Photo', platform: 'Twitter/X', width: 400, height: 400, shape: 'circle' },
  { id: 'linkedin', name: 'Profile Photo', platform: 'LinkedIn', width: 400, height: 400, shape: 'circle' },
  { id: 'github', name: 'Avatar', platform: 'GitHub', width: 500, height: 500, shape: 'square' },
  { id: 'slack', name: 'Profile', platform: 'Slack', width: 512, height: 512, shape: 'square' },
  { id: 'discord', name: 'Avatar', platform: 'Discord', width: 128, height: 128, shape: 'circle' },
  { id: 'instagram', name: 'Profile', platform: 'Instagram', width: 320, height: 320, shape: 'circle' },
  { id: 'facebook', name: 'Profile', platform: 'Facebook', width: 180, height: 180, shape: 'circle' },
  { id: 'youtube', name: 'Channel Icon', platform: 'YouTube', width: 800, height: 800, shape: 'circle' },
  { id: 'whatsapp', name: 'Profile', platform: 'WhatsApp', width: 500, height: 500, shape: 'circle' },
  { id: 'tiktok', name: 'Profile', platform: 'TikTok', width: 200, height: 200, shape: 'circle' },
];

export const ASPECT_RATIOS = [
  { label: 'Free', value: undefined },
  { label: '1:1 (Square)', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
] as const;

export const OUTPUT_FORMATS = [
  { label: 'JPEG', value: 'image/jpeg' as const, extension: 'jpg' },
  { label: 'PNG', value: 'image/png' as const, extension: 'png' },
  { label: 'WebP', value: 'image/webp' as const, extension: 'webp' },
] as const;
