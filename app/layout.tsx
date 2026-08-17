import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

/**
 * Root layout — wraps every page in the application.
 *
 * Responsibilities:
 * - Load and apply the Inter font via next/font (zero-CLS, self-hosted)
 * - Set global metadata and viewport
 * - Mount the Sonner toast container
 *
 * The 'dark' class on <html> enables dark mode globally.
 * Phase 3 will add a theme toggle using next-themes.
 */

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Community Growth Platform',
    template: '%s | Community Growth Platform',
  },
  description:
    'A platform for managing community growth contributors, tasks, and payments.',
  robots: {
    index: false,  // Not indexed until public launch
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f0f18' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
