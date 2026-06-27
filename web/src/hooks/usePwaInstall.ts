'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const DISMISS_KEY = 'gowrax-pwa-install-dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<unknown>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  )
}

export function usePwaInstall() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [hasNativePrompt, setHasNativePrompt] = useState(false)

  useEffect(() => {
    if (isStandaloneMode()) return
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    const ios = isIOSDevice()
    setIsIOS(ios)

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent
      setHasNativePrompt(true)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    if (ios) {
      setShowBanner(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const install = useCallback(async () => {
    const prompt = deferredRef.current
    if (!prompt) return false
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    deferredRef.current = null
    setHasNativePrompt(false)
    if (outcome === 'accepted') setShowBanner(false)
    return outcome === 'accepted'
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1')
    setShowBanner(false)
  }, [])

  return { showBanner, isIOS, hasNativePrompt, install, dismiss }
}
