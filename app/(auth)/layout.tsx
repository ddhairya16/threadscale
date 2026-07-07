/**
 * Auth layout — wraps /login and /verify pages.
 * Full-screen centered layout with animated gradient background.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center p-4">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-64 -right-64 h-[700px] w-[700px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.22 265 / 0.12), transparent 70%)',
            animation: 'pulse 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-64 -left-64 h-[700px] w-[700px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.18 295 / 0.10), transparent 70%)',
            animation: 'pulse 10s ease-in-out infinite 3s',
          }}
        />
        <div
          className="absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.20 230 / 0.08), transparent 70%)',
            animation: 'pulse 12s ease-in-out infinite 6s',
          }}
        />
        {/* Fine grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
