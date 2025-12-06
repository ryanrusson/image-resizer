'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export function ImageUploader({ onImageSelect, disabled }: ImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const preview = URL.createObjectURL(file);
        onImageSelect(file, preview);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxSize: MAX_SIZE,
      multiple: false,
      disabled,
    });

  const rejectionMessage = fileRejections.length > 0
    ? fileRejections[0].errors[0].message
    : null;

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center justify-center w-full min-h-[300px] p-8',
        'border-2 border-dashed rounded-xl cursor-pointer transition-colors',
        'bg-muted/30 hover:bg-muted/50',
        isDragActive && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed',
        rejectionMessage && 'border-destructive'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={cn(
            'p-4 rounded-full bg-muted',
            isDragActive && 'bg-primary/10'
          )}
        >
          {isDragActive ? (
            <Upload className="w-10 h-10 text-primary" />
          ) : (
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop your image here' : 'Drag & drop an image here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse your files
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Supports JPEG, PNG, WebP, GIF (max 20MB)
        </p>

        {rejectionMessage && (
          <p className="text-sm text-destructive font-medium">
            {rejectionMessage}
          </p>
        )}
      </div>
    </div>
  );
}
