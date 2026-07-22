import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { ReferralClient } from '@/components/referrals/referral-client'

export const metadata = {
  title: 'Referrals | Community Growth',
}

export default async function ReferralsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createClient()

  // Fetch referrals
  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      id,
      bonus_amount_inr,
      bonus_status,
      created_at,
      profiles!referred_id(full_name, email)
    `)
    .eq('referrer_id', session.userId)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8 pb-10 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Referrals</h1>
        <p className="text-muted-foreground mt-1">Invite friends and earn ₹25 when they complete their first task.</p>
      </div>

      <ReferralClient 
        referralCode={session.profile.referral_code} 
        referrals={(referrals as any) || []} 
      />
    </div>
  )
}
