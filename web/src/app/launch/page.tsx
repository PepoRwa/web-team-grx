'use client'

import { LaunchPage } from '@/components/launch/launch-page'
import { useAuth } from '@/hooks/useAuth'

export default function LaunchRoutePage() {
  const { signInWithDiscord, loading, error } = useAuth()

  return (
    <LaunchPage
      onLogin={signInWithDiscord}
      loginLoading={loading}
      loginError={error}
    />
  )
}
