import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/get-session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  // Basic sanity check, real production uses RLS + middleware for admin check
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, notes } = await req.json()
  const { id: submissionId } = await params

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  try {
    const supabase = await createAdminClient()

    // 1. Get the submission to find the assignment_id and discord_id
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('assignment_id, profile_id, profiles (discord_id)')
      .eq('id', submissionId)
      .single()

    if (subError || !submission) {
      throw new Error('Submission not found')
    }

    // 2. Update Submission
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { data: updatedSub, error: updateSubError } = await supabase
      .from('submissions')
      .update({
        status: newStatus,
        reviewed_by: session.profile.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (updateSubError) throw updateSubError

    // 3. Update Assignment Status
    const assignmentStatus = action === 'approve' ? 'approved' : 'rejected'
    
    // Only update completed_at if it's approved
    const assignmentUpdate: any = { status: assignmentStatus }
    if (action === 'approve') {
      assignmentUpdate.completed_at = new Date().toISOString()
    }
    
    const { data: updatedAssignment, error: updateAssignError } = await supabase
      .from('assignments')
      .update(assignmentUpdate)
      .eq('id', submission.assignment_id)
      .select('status, id')
      .single()

    if (updateAssignError) throw updateAssignError

    // 4. Create Audit Log
    await supabase.from('audit_logs').insert({
      actor_id: session.profile.id,
      actor_role: 'admin',
      action: action === 'approve' ? 'submission_approved' : 'submission_rejected',
      target_type: 'submission',
      target_id: submissionId,
      after_state: updatedSub
    })

    // 5. Google Sheets Reporting (Fire-and-forget)
    if (action === 'approve') {
      // Fetch full context needed for reporting
      supabase.from('assignments').select(`
        id, rate_snapshot_inr, 
        tasks (title, projects (name, clients (name))),
        profiles (email),
        reddit_accounts (username)
      `).eq('id', submission.assignment_id).single().then(({ data: assignData, error: assignError }) => {
        if (assignError || !assignData) {
          console.error('[Reporting] Failed to fetch assignment details:', assignError)
          return
        }

        const { GoogleSheetsReportingProvider } = require('@/lib/providers/reporting/google-sheets.provider')
        const reporting = new GoogleSheetsReportingProvider()
        
        const taskInfo = assignData.tasks as any
        const projectName = taskInfo?.projects?.name || 'N/A'
        const clientName = taskInfo?.projects?.clients?.name || 'N/A'
        
        reporting.logApprovedAssignment({
          approvalDate: new Date().toISOString(),
          assignmentId: assignData.id,
          submissionId: submissionId,
          contributorEmail: (assignData.profiles as any)?.email || 'Unknown',
          redditUsername: (assignData.reddit_accounts as any)?.username || 'Unknown',
          clientName: clientName,
          projectName: projectName,
          taskTitle: taskInfo?.title || 'Unknown',
          rewardInr: assignData.rate_snapshot_inr,
          paymentStatus: 'pending',
          paidDate: null,
          approvedByEmail: session.profile.email,
        }).catch((err: any) => {
          console.error('[Reporting] Async Sheets log failed:', err)
        })
      })
    }

    // 6. Discord Notification (Fire-and-forget)
    Promise.resolve().then(async () => {
      const type = action === 'approve' ? 'submission_approved' : 'submission_rejected'
      const title = action === 'approve' ? 'Submission Approved!' : 'Submission Rejected'
      const body = action === 'approve' 
        ? 'Your recent task submission has been approved.' 
        : `Your submission was rejected. Reason: ${notes || 'No notes provided.'}`
      const discordId = (submission.profiles as any)?.discord_id

      // 6a. Log to Supabase
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .insert({
          profile_id: submission.profile_id,
          type: type,
          title: title,
          body: body,
          channel: 'discord',
          metadata: {
            submission_id: submissionId,
            assignment_id: submission.assignment_id,
            notes: notes
          }
        })
        .select('id')
        .single()
        
      if (notifError || !notifData) {
        console.error('[Notification] Failed to log notification to database:', notifError)
        return
      }

      if (!discordId) {
         await supabase.from('notifications').update({
           error_message: 'User has no Discord ID linked',
           discord_sent: false
         }).eq('id', notifData.id)
         return
      }

      // 6b. Send via Provider
      const { DiscordNotificationProvider } = require('@/lib/providers/notifications/discord.provider')
      const provider = new DiscordNotificationProvider()
      
      const { sent, error } = await provider.send({
        discordUserId: discordId,
        type: type,
        title: title,
        body: body,
        metadata: {
           notes: notes || undefined
        }
      })
      
      // 6c. Update Log
      await supabase.from('notifications').update({
        discord_sent: sent,
        discord_sent_at: sent ? new Date().toISOString() : null,
        error_message: error || null
      }).eq('id', notifData.id)
      
    }).catch(err => {
      console.error('[Notification] Unhandled error during discord notify:', err)
    })

    return NextResponse.json({ 
      success: true, 
      submission: updatedSub,
      assignment: updatedAssignment 
    })

  } catch (error: any) {
    console.error('[Review Error]', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
