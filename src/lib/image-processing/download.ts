export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke after a short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function generateFilename(
  originalName: string,
  preset: string | null,
  format: string
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const suffix = preset ? `-${preset}` : '-resized';
  const extension = format.split('/')[1] || 'png';
  return `${baseName}${suffix}.${extension}`;
}
