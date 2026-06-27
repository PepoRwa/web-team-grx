'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listAnnouncements } from '@/lib/api'

export function useHubAnnouncementBadge() {
  const { session } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!session?.access_token) {
      setCount(0)
      return
    }
    listAnnouncements(session.access_token)
      .then((d) => setCount(d.unreadCount))
      .catch(() => setCount(0))
  }, [session?.access_token])

  return count
}
