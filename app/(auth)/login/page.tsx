'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api/auth'
import { ApiClientError } from '@/lib/api/client'
import type { Metadata } from 'next'

// Note: can't export metadata from a 'use client' component.
// Set it in a parent server component if needed. Title is set in layout.tsx.

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || loading) return

    setLoading(true)
    try {
      await authApi.sendOtp({ email: email.trim().toLowerCase() })
      toast.success('Code sent! Check your email.')
      router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`)
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Something went wrong. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
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
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Community Growth</h1>
            <p className="text-xs text-muted-foreground">Contributor Platform</p>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeUp} className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your email to receive a one-time sign-in code
          </p>
        </motion.div>

        {/* Form */}
        <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
                className="pl-9 h-11 bg-secondary/40 border-border/60 focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!email || loading}
            className="w-full h-11 font-medium gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-primary/30 hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending code…
              </>
            ) : (
              <>
                Send code
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </motion.form>

        {/* Footer note */}
        <motion.p variants={fadeUp} className="mt-6 text-center text-xs text-muted-foreground">
          New here?{' '}
          <span className="text-foreground/70">
            You need an invitation link to join.
          </span>
        </motion.p>
      </div>

      {/* Bottom caption */}
      <motion.p variants={fadeUp} className="mt-4 text-center text-xs text-muted-foreground/60">
        By signing in you agree to our{' '}
        <span className="underline underline-offset-2 cursor-pointer hover:text-muted-foreground">Terms</span>
        {' & '}
        <span className="underline underline-offset-2 cursor-pointer hover:text-muted-foreground">Privacy</span>
      </motion.p>
    </motion.div>
  )
}
