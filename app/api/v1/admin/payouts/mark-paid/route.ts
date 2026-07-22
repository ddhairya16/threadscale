import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/get-session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profileId, assignmentIds, amount } = await req.json()

  if (!profileId || !assignmentIds || assignmentIds.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const supabase = await createAdminClient()

    // We create a payment record for each assignment, but in a batch payment system
    // you might have a single payment record for multiple assignments.
    // However, our schema `payments` has `assignment_id` as a column, implying 1 payment per assignment.
    // Let's create multiple payment records.

    // First fetch the assignments to ensure they exist and get their amounts
    const { data: assignments, error: fetchError } = await supabase
      .from('assignments')
      .select('id, rate_snapshot_inr')
      .in('id', assignmentIds)
      .eq('status', 'approved')
      .eq('profile_id', profileId)

    if (fetchError || !assignments || assignments.length === 0) {
      throw new Error('Assignments not found or not approved')
    }

    const paymentRecords = assignments.map(a => ({
      profile_id: profileId,
      assignment_id: a.id,
      amount_inr: a.rate_snapshot_inr || 0,
      payment_type: 'task' as const,
      status: 'paid' as const,
      approved_at: new Date().toISOString(),
      approved_by: session.profile.id,
      paid_at: new Date().toISOString(),
      paid_by: session.profile.id,
    }))

    // Insert payments
    const { error: paymentError } = await supabase
      .from('payments')
      .insert(paymentRecords)

    if (paymentError) {
      throw paymentError
    }

    // Create Audit Log
    await supabase.from('audit_logs').insert({
      actor_id: session.profile.id,
      actor_role: 'admin',
      action: 'payment_completed',
      target_type: 'profile',
      target_id: profileId,
      after_state: { amount, assignment_count: assignmentIds.length }
    })

    // Discord Notification (Fire-and-forget)
    Promise.resolve().then(async () => {
      // Fetch user's discord ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('discord_id')
        .eq('id', profileId)
        .single()
        
      const discordId = profile?.discord_id
      
      const type = 'payment_completed'
      const title = 'Payment Sent!'
      const body = `Your payment of ₹${amount} has been processed for ${assignmentIds.length} tasks.`
      
      // Log to Supabase
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .insert({
          profile_id: profileId,
          type: type,
          title: title,
          body: body,
          channel: 'discord',
          metadata: { amount, count: assignmentIds.length }
        })
        .select('id')
        .single()
        
      if (notifError || !notifData) {
        console.error('[Notification] Failed to log payment notification:', notifError)
        return
      }

      if (!discordId) {
         await supabase.from('notifications').update({
           error_message: 'User has no Discord ID linked',
           discord_sent: false
         }).eq('id', notifData.id)
         return
      }

      // Send via Provider
      const { DiscordNotificationProvider } = require('@/lib/providers/notifications/discord.provider')
      const provider = new DiscordNotificationProvider()
      
      const { sent, error } = await provider.send({
        discordUserId: discordId,
        type: type,
        title: title,
        body: body,
        metadata: {
           amount: amount,
           tasks_paid: assignmentIds.length
        }
      })
      
      // Update Log
      await supabase.from('notifications').update({
        discord_sent: sent,
        discord_sent_at: sent ? new Date().toISOString() : null,
        error_message: error || null
      }).eq('id', notifData.id)
      
    }).catch(err => {
      console.error('[Notification] Unhandled error during payment notify:', err)
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[Mark Paid Error]', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
