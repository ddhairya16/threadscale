import sharp from 'sharp'

export interface CompressedImage {
  buffer: Buffer
  sizeBytes: number
  width: number
  height: number
  mimeType: 'image/webp'
}

const MAX_DIMENSION_PX = 2048
const WEBP_QUALITY = 80
const MAX_INPUT_BYTES = 15 * 1024 * 1024  // 15 MB

/**
 * Validates image MIME type by inspecting buffer magic bytes.
 * Does NOT trust the Content-Type header (can be spoofed).
 */
export function validateImageBuffer(buffer: Buffer): { valid: boolean; mimeType?: string } {
  if (buffer.length < 12) return { valid: false }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: 'image/jpeg' }
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, mimeType: 'image/png' }
  }
  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, mimeType: 'image/webp' }
  }
  // GIF: GIF8
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { valid: true, mimeType: 'image/gif' }
  }

  return { valid: false }
}

/**
 * Compresses an image buffer to WebP format.
 *
 * Pipeline:
 *   1. Reject if > 15MB
 *   2. Validate MIME type from magic bytes
 *   3. Auto-rotate based on EXIF orientation
 *   4. Strip ALL EXIF metadata (privacy protection)
 *   5. Resize to max 2048px on longest dimension (no upscaling)
 *   6. Convert to WebP at quality 80
 *
 * @throws Error if the file is too large or not a supported image type
 */
export async function compressImage(input: Buffer): Promise<CompressedImage> {
  if (input.length > MAX_INPUT_BYTES) {
    throw new Error(`File too large. Maximum size is 15MB. Received ${(input.length / 1024 / 1024).toFixed(1)}MB.`)
  }

  const { valid } = validateImageBuffer(input)
  if (!valid) {
    throw new Error('Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF image.')
  }

  const image = sharp(input)
  const metadata = await image.metadata()

  const width = metadata.width ?? 0
  const height = metadata.height ?? 0

  // Only resize if image exceeds the max dimension
  const needsResize = width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX
  const resizeOptions = needsResize
    ? { width: MAX_DIMENSION_PX, height: MAX_DIMENSION_PX, fit: 'inside' as const, withoutEnlargement: true }
    : undefined

  let pipeline = image
    .rotate()                      // Auto-rotate based on EXIF orientation
    .withMetadata({ exif: {} })    // Strip EXIF metadata (keeps color profile)

  if (resizeOptions) {
    pipeline = pipeline.resize(resizeOptions) as typeof pipeline
  }

  const buffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer()
  const outputMeta = await sharp(buffer).metadata()

  return {
    buffer,
    sizeBytes: buffer.length,
    width: outputMeta.width ?? 0,
    height: outputMeta.height ?? 0,
    mimeType: 'image/webp',
  }
}
