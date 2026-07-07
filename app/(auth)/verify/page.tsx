'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/auth/otp-input'
import { authApi } from '@/lib/api/auth'
import { ApiClientError } from '@/lib/api/client'

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const RESEND_SECONDS = 60

/** Masks an email: dhairya@gmail.com → d*****@gmail.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 5))}@${domain}`
}

function VerifyPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const email        = searchParams.get('email') ?? ''

  const [verifying, setVerifying]   = useState(false)
  const [verified,  setVerified]    = useState(false)
  const [resending, setResending]   = useState(false)
  const [countdown, setCountdown]   = useState(RESEND_SECONDS)

  // Redirect to login if no email param
  useEffect(() => {
    if (!email) router.replace('/login')
  }, [email, router])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleComplete = useCallback(
    async (code: string) => {
      if (verifying || verified) return
      setVerifying(true)
      try {
        const data = await authApi.verifyOtp({ email, token: code })
        setVerified(true)
        toast.success('Verified! Signing you in…')
        // Small delay for the success animation, then redirect
        setTimeout(() => {
          window.location.href = data.redirect
        }, 800)
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Invalid code. Please try again.'
        toast.error(message)
        setVerifying(false)
      }
    },
    [email, verifying, verified]
  )

  async function handleResend() {
    if (resending || countdown > 0) return
    setResending(true)
    try {
      await authApi.sendOtp({ email })
      toast.success('New code sent!')
      setCountdown(RESEND_SECONDS)
    } catch {
      toast.error('Could not resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {/* Card */}
      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">

        {/* Logo */}
        <motion.div variants={fadeUp} className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeUp} className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Check your email
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We sent a sign-in link and a 6-digit code to <br/>
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </motion.div>

        {/* Info Box */}
        <motion.div variants={fadeUp} className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary text-center">
          <p><strong>Click the link in your email to sign in instantly.</strong></p>
          <p className="mt-1 opacity-80 text-xs">If you received a 6-digit code instead, you can enter it below.</p>
        </motion.div>

        {/* OTP Input or success state */}
        <motion.div variants={fadeUp} className="mb-6">
          {verified ? (
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className="h-16 w-16 text-primary" />
              </motion.div>
            </div>
          ) : (
            <OtpInput
              onComplete={handleComplete}
              disabled={verifying}
            />
          )}
        </motion.div>

        {/* Verify button (visible while loading) */}
        {verifying && !verified && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 flex justify-center"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </div>
          </motion.div>
        )}

        {/* Resend + back — hidden after success */}
        {!verified && (
          <motion.div variants={fadeUp} className="space-y-3">
            {/* Resend */}
            <div className="flex justify-center">
              {countdown > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Resend code in{' '}
                  <span className="tabular-nums font-medium text-foreground">
                    {countdown}s
                  </span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {resending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Resend code
                </button>
              )}
            </div>

            {/* Back */}
            <div className="flex justify-center">
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Wrong email? Go back
              </button>
            </div>
          </motion.div>
        )}

        {/* Helper text */}
        {!verified && (
          <motion.p variants={fadeUp} className="mt-6 text-center text-xs text-muted-foreground/60">
            Code expires in 10 minutes. Check spam if you don&apos;t see it.
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Verify page — enter the 6-digit OTP code from email.
 *
 * Wrapped in Suspense because useSearchParams() requires it
 * when used in a Client Component in the App Router.
 */
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  )
}
