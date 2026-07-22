import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { processScreenshot } from '@/lib/utils/image'
import { GoogleDriveStorageProvider } from '@/lib/providers/storage/google-drive.provider'
import { extractRedditMetadata } from '@/lib/utils/reddit'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const taskId = formData.get('taskId') as string
    const redditUrl = formData.get('redditUrl') as string
    const insightsStr = formData.get('insights') as string
    const screenshots = formData.getAll('screenshots') as File[]

    if (!taskId || !redditUrl || screenshots.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const insights = insightsStr ? JSON.parse(insightsStr) : null
    const metadata = extractRedditMetadata(redditUrl)

    // Setup providers
    const storage = new GoogleDriveStorageProvider()
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    // 1. Verify task assignment exists
    // (In a real app with real UUIDs, we would query Supabase here to ensure
    // the user is assigned to this task. For this demo/phase 5 UI, we mock this).

    // 2. Process and Upload Images
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0') // 01 to 12
    const folderPath = `Submissions/${year}/${month}/assignment_${taskId}`

    const uploadedRefs = []
    
    for (let i = 0; i < screenshots.length; i++) {
      const file = screenshots[i]
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Compress and format image
      const processed = await processScreenshot(buffer)
      
      // Upload to storage provider
      const uploadResult = await storage.upload({
        buffer: processed.buffer,
        filename: `proof_${i+1}.webp`,
        mimeType: 'image/webp',
        folderPath
      })
      
      uploadedRefs.push({
        fileId: uploadResult.fileId,
        webUrl: uploadResult.webUrl,
        filename: uploadResult.filename,
        sizeBytes: uploadResult.sizeBytes,
        metadata: processed.metadata
      })
    }

    // 3. Insert into Supabase
    const { count, error: countError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('assignment_id', taskId)

    const attemptNumber = countError ? 1 : (count || 0) + 1

    const { data: submission, error: submitError } = await supabase
      .from('submissions')
      .insert({
        assignment_id: taskId, // the client passes the assignment_id as taskId
        profile_id: session.profile.id,
        reddit_url: metadata.permalink || redditUrl,
        detected_type: metadata.type,
        screenshot_refs: uploadedRefs,
        insight_text: insights ? JSON.stringify(insights) : null,
        attempt_number: attemptNumber,
        status: 'pending'
      })
      .select()
      .single()

    if (submitError) throw submitError

    // 4. Update Assignment status to submitted
    const { error: updateError } = await adminSupabase
      .from('assignments')
      .update({ status: 'submitted' })
      .eq('id', taskId)
      
    if (updateError) throw updateError

    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id,
      metadata,
      uploadedRefs 
    })

  } catch (error: any) {
    console.error('[Submit Proof Error]', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
