import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createClient } from '@/lib/supabase/server'
import { success, error, handleRouteError } from '@/lib/utils/api-response'
import { z } from 'zod'
import { HttpError } from '@/lib/utils/errors'

const schema = z.object({
  assignmentId: z.string().uuid(),
  textContent: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()

    const body = await req.json()
    const validatedData = schema.parse(body)

    // Verify assignment belongs to user
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, submissions(id)')
      .eq('id', validatedData.assignmentId)
      .eq('profile_id', session.userId)
      .single()

    if (assignmentError || !assignment) {
      throw new HttpError(404, 'Assignment not found')
    }

    const submissionId = assignment.submissions?.[0]?.id

    if (!submissionId) {
      throw new HttpError(400, 'Cannot add insights before submitting proof')
    }

    // Upsert insight
    const { data: insight, error: upsertError } = await supabase
      .from('insights')
      .upsert(
        {
          profile_id: session.userId,
          submission_id: submissionId,
          text_content: validatedData.textContent,
          image_refs: []
        },
        { onConflict: 'submission_id' }
      )
      .select()
      .single()

    if (upsertError) {
      console.error(upsertError)
      throw new HttpError(500, 'Failed to save insights')
    }

    return success(insight)
  } catch (err) {
    return handleRouteError(err)
  }
}
