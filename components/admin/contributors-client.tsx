'use client'

import { useState } from 'react'
import { Search, ChevronDown, Shield, UserX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Contributor {
  id: string
  email: string
  full_name: string | null
  upi_id: string | null
  status: string
  created_at: string
  reddit_accounts: { id: string; username: string; is_active: boolean }[]
}

export function ContributorsClient({ contributors }: { contributors: Contributor[] }) {
  const [search, setSearch] = useState('')

  const filtered = contributors.filter(c =>
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} contributors</span>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Contributor</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Reddit Accounts</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">UPI ID</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  No contributors found.
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-foreground">{c.full_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {c.reddit_accounts?.length > 0 ? (
                        c.reddit_accounts.map(ra => (
                          <span key={ra.id} className="inline-flex items-center rounded-full border border-[#FF4500]/20 bg-[#FF4500]/10 px-2 py-0.5 text-xs font-medium text-[#FF4500]">
                            u/{ra.username}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">None added</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground">
                    {c.upi_id ?? <span className="italic text-xs">Not set</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                      c.status === 'suspended' ? 'bg-red-500/10 text-red-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
