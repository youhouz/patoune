// ─────────────────────────────────────────────────────────────────────────────
// Pépète — Image compressor utility
// Compresses images before upload to stay under Vercel's 4.5MB body limit.
// Uses expo-image-manipulator on native, canvas on web.
// ─────────────────────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

const MAX_DIMENSION = 800;       // px — max width or height
const AVATAR_MAX_DIMENSION = 400; // px — smaller for avatars
const JPEG_QUALITY = 0.6;
const MAX_BASE64_LENGTH = 1.5 * 1024 * 1024; // ~1.5MB base64 string

/**
 * Compress an image from ImagePicker result asset.
 * Returns a data URI string: "data:image/jpeg;base64,..."
 *
 * @param {object} asset - ImagePicker result asset (with uri, base64, width, height)
 * @param {object} options - { maxDimension, quality }
 * @returns {Promise<string>} compressed data URI
 */
export async function compressImage(asset, options = {}) {
  const maxDim = options.maxDimension || MAX_DIMENSION;
  const quality = options.quality || JPEG_QUALITY;

  // If on web, use canvas-based compression
  if (Platform.OS === 'web') {
    return compressWithCanvas(asset, maxDim, quality);
  }

  // On native, use expo-image-manipulator
  return compressWithManipulator(asset, maxDim, quality);
}

/**
 * Shortcut for avatar compression (smaller dimensions).
 */
export async function compressAvatar(asset) {
  return compressImage(asset, {
    maxDimension: AVATAR_MAX_DIMENSION,
    quality: 0.5,
  });
}

// ─── Native (expo-image-manipulator) ────────────────────────────────────────
async function compressWithManipulator(asset, maxDim, quality) {
  try {
    const ImageManipulator = require('expo-image-manipulator');
    const { width, height, uri } = asset;

    const actions = [];

    // Resize if image is larger than maxDim
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        actions.push({ resize: { width: maxDim } });
      } else {
        actions.push({ resize: { height: maxDim } });
      }
    }

    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    if (result.base64) {
      return `data:image/jpeg;base64,${result.base64}`;
    }

    // Fallback to original base64 if manipulator didn't return base64
    if (asset.base64) {
      return `data:image/jpeg;base64,${asset.base64}`;
    }

    return asset.uri;
  } catch (err) {
    console.warn('Image compression failed, using original:', err.message);
    if (asset.base64) {
      return `data:image/jpeg;base64,${asset.base64}`;
    }
    return asset.uri;
  }
}

// ─── Web (Canvas) ───────────────────────────────────────────────────────────
function compressWithCanvas(asset, maxDim, quality) {
  return new Promise((resolve) => {
    const uri = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : asset.uri;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;

      // Scale down if needed
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUri = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUri);
    };
    img.onerror = () => {
      // Fallback
      resolve(uri);
    };
    img.src = uri;
  });
}
