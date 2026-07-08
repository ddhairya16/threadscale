'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, LogOut } from 'lucide-react'
import { SidebarNav } from './sidebar-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

export function MobileNav({ userEmail, role }: { userEmail: string; role: string }) {
  const [open, setOpen] = useState(false)
  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : 'CO'

  return (
    <header className="md:hidden sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/40 bg-card/60 backdrop-blur-md px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/15 ring-1 ring-primary/30">
          <svg className="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="font-semibold text-sm tracking-tight text-foreground">Community Growth</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground" />}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-[80vw] max-w-xs flex flex-col p-0 border-r-border/40 bg-card/95 backdrop-blur-xl">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          
          <div className="h-14 flex items-center px-6 border-b border-border/40">
            <span className="font-semibold tracking-tight text-foreground">Menu</span>
          </div>
          
          <div className="flex-1 overflow-auto">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
          
          <div className="border-t border-border/40 p-4 shrink-0 bg-background/50">
            <div className="flex items-center gap-3 mb-4">
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
            
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <form action="/api/v1/auth/logout" method="POST">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" type="submit" title="Log out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
