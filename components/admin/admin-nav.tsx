'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Building2, FolderKanban, ClipboardList, CheckSquare, LogOut, ChevronDown, MessageSquare } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useState } from 'react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/contributors', label: 'Contributors', icon: Users },
  { href: '/admin/clients', label: 'Clients', icon: Building2 },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/admin/assignments', label: 'Assignments', icon: CheckSquare },
  { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
]

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 h-14">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2 mr-6 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/15 ring-1 ring-primary/30">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold tracking-tight text-foreground hidden sm:block">Admin</span>
        </Link>

        {/* Nav items */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
          {navItems.map(item => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin'
            const exactActive = item.exact && pathname === item.href
            const active = item.exact ? exactActive : isActive
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <ThemeToggle />
          <span className="text-xs text-muted-foreground hidden md:block">{email}</span>
          <form action="/api/v1/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
