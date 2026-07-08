'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react'

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

function VerifyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [mounted, setMounted] = useState(false)

  // Redirect to login if no email param
  useEffect(() => {
    setMounted(true)
    if (!email) {
      router.replace('/login')
    }
  }, [email, router])

  if (!mounted || !email) return null

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20 text-center">
        <motion.div variants={fadeUp} className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <MailCheck className="h-8 w-8" />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a secure magic link to <br/>
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm">
          <p className="font-medium text-foreground">Click the link in the email to sign in instantly.</p>
          <p className="mt-1 text-muted-foreground text-xs">You can safely close this tab.</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <button
            onClick={() => router.push('/login')}
            className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Wrong email? Go back
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

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
