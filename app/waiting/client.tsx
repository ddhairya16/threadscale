'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await authApi.logout()
      router.push('/login')
    } catch (err) {
      console.error('Logout failed', err)
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={loading}>
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? 'Signing Out...' : 'Sign Out'}
    </Button>
  )
}
