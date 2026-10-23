/**
 * Cloudinary Client URL Utilities
 * Pure string transformation utility safe for Client Components and Edge Runtime.
 * Contains no Node.js built-in module dependencies (like 'fs' or 'path').
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'thumb' | 'fit' | 'limit' | 'scale';
  gravity?: 'face' | 'auto' | 'center';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

export function buildCloudinaryUrl(
  urlOrPublicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  if (!urlOrPublicId) return '';

  const {
    width = 300,
    height = 300,
    crop = 'thumb',
    gravity = 'face',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transform = `c_${crop},g_${gravity},w_${width},h_${height},q_${quality},f_${format}`;

  // If already a Cloudinary delivery URL
  if (urlOrPublicId.includes('res.cloudinary.com')) {
    const parts = urlOrPublicId.split('/upload/');
    if (parts.length === 2) {
      // Strip any existing inline transformations to prevent duplicate layers
      const assetPath = parts[1].replace(/^c_[^/]+\//, '');
      return `${parts[0]}/upload/${transform}/${assetPath}`;
    }
    return urlOrPublicId;
  }

  // If it's a regular external HTTP URL (e.g. Unsplash), return as is
  if (urlOrPublicId.startsWith('http')) {
    return urlOrPublicId;
  }

  // Treat as Cloudinary public_id
  const cloud = CLOUD_NAME || 'digital-clinic';
  return `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${urlOrPublicId}`;
}
