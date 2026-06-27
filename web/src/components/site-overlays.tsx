'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { FeaturedAnnouncementOverlay } from '@/components/featured-announcement-overlay'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { useAuth } from '@/hooks/useAuth'
import {
  listFeaturedUnread,
  markAnnouncementRead,
  type SiteAnnouncement,
} from '@/lib/api'

/** Overlays hub : onboarding first-login → annonces premier plan. */
export function SiteOverlays() {
  const pathname = usePathname()
  const { session, user, permissions, loading } = useAuth()
  const [featured, setFeatured] = useState<SiteAnnouncement[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(false)
  const [marking, setMarking] = useState(false)

  const isHub = pathname?.startsWith('/hub')
  const onboardingDone = Boolean(user?.onboardingCompletedAt)
  const canLoadFeatured =
    isHub &&
    !loading &&
    Boolean(session?.access_token) &&
    onboardingDone &&
    permissions?.canAccessSite

  const loadFeatured = useCallback(async () => {
    if (!session?.access_token) return
    setFeaturedLoading(true)
    try {
      const { announcements } = await listFeaturedUnread(session.access_token)
      setFeatured(announcements)
    } catch {
      setFeatured([])
    } finally {
      setFeaturedLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (canLoadFeatured) void loadFeatured()
  }, [canLoadFeatured, loadFeatured])

  async function handleMarkRead(id: number) {
    if (!session?.access_token) return
    setMarking(true)
    try {
      await markAnnouncementRead(session.access_token, id)
      setFeatured((prev) => prev.filter((a) => a.id !== id))
    } finally {
      setMarking(false)
    }
  }

  if (!isHub) return null

  const current = featured[0]
  const showOnboarding = !loading && session && user && !onboardingDone

  return (
    <>
      {showOnboarding && <OnboardingWizard />}
      {!showOnboarding && !featuredLoading && current && (
        <FeaturedAnnouncementOverlay
          announcement={current}
          index={0}
          total={featured.length}
          marking={marking}
          onMarkRead={() => void handleMarkRead(current.id)}
        />
      )}
    </>
  )
}
