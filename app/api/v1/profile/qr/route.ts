import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { processScreenshot } from '@/lib/utils/image'
import { GoogleDriveStorageProvider } from '@/lib/providers/storage/google-drive.provider'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const qrImage = formData.get('qrCode') as File | null

    if (!qrImage) {
      return NextResponse.json({ error: 'Missing QR code image' }, { status: 400 })
    }

    // Setup providers
    const storage = new GoogleDriveStorageProvider()
    const supabase = await createClient()

    // 1. Process and Upload Image
    const arrayBuffer = await qrImage.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Compress and format image
    const processed = await processScreenshot(buffer)
    
    const folderPath = `payment_qrs/${session.profile.id}`
    
    // Upload to storage provider
    const uploadResult = await storage.upload({
      buffer: processed.buffer,
      filename: `qr_code.webp`,
      mimeType: 'image/webp',
      folderPath
    })
    
    const payment_qr_ref = {
      fileId: uploadResult.fileId,
      webUrl: uploadResult.webUrl,
      filename: uploadResult.filename,
      sizeBytes: uploadResult.sizeBytes,
      metadata: processed.metadata
    }

    // 2. Update Profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ payment_qr_ref })
      .eq('id', session.profile.id)
      .select('payment_qr_ref')
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ 
      success: true, 
      payment_qr_ref: profile.payment_qr_ref
    })

  } catch (error) {
    console.error('[Upload QR Error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
