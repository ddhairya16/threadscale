'use client'

import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { SidebarNav } from './sidebar-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function Sidebar({ userEmail, role }: { userEmail: string; role: string }) {
  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : 'CO'

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card/30 backdrop-blur-md h-screen sticky top-0 shrink-0">
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/15 ring-1 ring-primary/30">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold tracking-tight text-foreground">Community Growth</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <SidebarNav />

      {/* Footer / Profile */}
      <div className="mt-auto border-t border-border/40 p-4 shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate text-foreground">{userEmail}</span>
            <span className="text-xs text-muted-foreground capitalize">{role}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          <form action="/api/v1/auth/logout" method="POST">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" type="submit" title="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}
