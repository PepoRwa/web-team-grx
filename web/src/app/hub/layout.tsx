'use client'

import { LaunchGuard } from '@/components/launch/launch-guard'

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return <LaunchGuard>{children}</LaunchGuard>
}
