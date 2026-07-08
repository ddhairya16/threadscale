import sharp from 'sharp'

interface ProcessImageResult {
  buffer: Buffer
  metadata: {
    width: number
    height: number
    size: number
    format: string
  }
}

/**
 * Processes an uploaded image for storage:
 * - Resizes to max 1600px width or height (maintaining aspect ratio)
 * - Converts to WebP format (quality 80 for good compression vs quality)
 * - Strips EXIF/metadata
 */
export async function processScreenshot(inputBuffer: Buffer): Promise<ProcessImageResult> {
  const image = sharp(inputBuffer)
  
  const processed = await image
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true // don't upscale small images
    })
    .webp({ quality: 80, effort: 4 }) // effort 4 is default, good balance
    .toBuffer({ resolveWithObject: true })
    
  return {
    buffer: processed.data,
    metadata: {
      width: processed.info.width,
      height: processed.info.height,
      size: processed.info.size,
      format: processed.info.format
    }
  }
}
