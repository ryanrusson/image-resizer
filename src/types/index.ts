export interface ImageFile {
  file: File;
  preview: string;
  width: number;
  height: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CropShape = 'rect' | 'circle' | 'oval';

export interface CropSettings {
  shape: CropShape;
  aspect: number | undefined; // undefined = free aspect
  zoom: number;
  rotation: number;
  area: CropArea | null;
  areaPixels: CropArea | null;
}

export interface CompressionSettings {
  quality: number; // 0-100
  maxWidth: number;
  maxHeight: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface AvatarPreset {
  id: string;
  name: string;
  platform: string;
  width: number;
  height: number;
  shape: 'square' | 'circle';
}

export interface ProcessedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
}
