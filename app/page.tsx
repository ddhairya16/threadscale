import Link from 'next/link'
import { ArrowRight, CheckCircle2, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { HeroCanvas } from '@/components/landing/hero-canvas'
import { ContactForm } from '@/components/landing/contact-form'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <HeroCanvas />

      {/* Navigation */}
      <header className="fixed top-0 w-full border-b border-border/40 bg-background/60 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
              <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight">Community Growth</span>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:flex">Log in</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 relative">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now accepting new contributors
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              Scale your <span className="text-primary">community</span> with top-tier contributors
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              We connect businesses with verified contributors to drive authentic engagement, manage tasks, and scale community growth on platforms like Reddit.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="https://discord.gg/HCN7pqBEW" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  Join as Contributor <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm border-border/50">
                  Hire Contributors
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card/30 border-y border-border/30 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">How it works</h2>
              <p className="text-muted-foreground">A seamless experience for both clients and contributors.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background/50 border border-border/50 p-8 rounded-2xl shadow-xl shadow-black/5">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Tasks Assigned</h3>
                <p className="text-muted-foreground">Admins create carefully crafted growth tasks and assign them to verified contributors.</p>
              </div>
              
              <div className="bg-background/50 border border-border/50 p-8 rounded-2xl shadow-xl shadow-black/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl pointer-events-none" />
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Work Executed</h3>
                <p className="text-muted-foreground">Contributors perform the actions authentically, submit proof, and provide insights.</p>
              </div>
              
              <div className="bg-background/50 border border-border/50 p-8 rounded-2xl shadow-xl shadow-black/5">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Growth Delivered</h3>
                <p className="text-muted-foreground">Work is reviewed, payments are disbursed via UPI, and client communities grow.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 relative">
          <div className="container mx-auto max-w-5xl px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold tracking-tight mb-6">Ready to scale your community?</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Get in touch with our team to discuss your goals. We'll design a custom growth strategy leveraging our network of verified contributors.
                </p>
                <ul className="space-y-4">
                  {[
                    "Dedicated account manager",
                    "Custom task templates",
                    "Quality assured results",
                    "Detailed performance reports"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <ContactForm />
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30 bg-background/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/15 ring-1 ring-primary/30">
              <svg className="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-medium text-sm">Community Growth</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Community Growth Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
