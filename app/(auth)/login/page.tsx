'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Mail, Key, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password || loading) return

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await authClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: 'Admin',
          callbackURL: '/admin',
        })
        if (error) {
          throw new Error(error.message || 'Signup failed')
        }
        toast.success('Admin account created! Redirecting...')
      } else {
        const { data, error } = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
          callbackURL: '/admin',
        })
        if (error) {
          throw new Error(error.message || 'Invalid email or password')
        }
        toast.success('Signed in successfully! Redirecting...')
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please try again.')
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
      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20 w-[400px]">

        {/* Logo */}
        <motion.div variants={fadeUp} className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Community Growth</h1>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeUp} className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === 'signin' ? 'Admin Sign In' : 'Admin Registration'}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === 'signin' 
              ? 'Enter your credentials to manage the platform' 
              : 'Create your master admin account'}
          </p>
        </motion.div>

        {/* Mode Switcher */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2 bg-secondary/20 p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'signin'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'signup'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Register
          </button>
        </motion.div>

        {/* Form */}
        <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Admin Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="pl-9 h-11 bg-secondary/40 border-border/60 focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                className="pl-9 h-11 bg-secondary/40 border-border/60 focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!email || !password || loading}
            className="w-full h-11 font-medium gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-primary/30 hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                {mode === 'signin' ? 'Sign In' : 'Register Admin'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </motion.form>
      </div>

      {/* Bottom caption */}
      <motion.p variants={fadeUp} className="mt-6 text-center text-xs text-muted-foreground/60">
        By signing in you agree to our{' '}
        <span className="underline underline-offset-2 cursor-pointer hover:text-muted-foreground">Terms</span>
        {' & '}
        <span className="underline underline-offset-2 cursor-pointer hover:text-muted-foreground">Privacy</span>
      </motion.p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
