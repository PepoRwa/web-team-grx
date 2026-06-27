'use client'

import { useEffect, useState, type RefObject } from 'react'

export function useScrollContainerProgress(containerRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onScroll() {
      const max = el!.scrollHeight - el!.clientHeight
      setProgress(max > 0 ? el!.scrollTop / max : 0)
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [containerRef])

  return progress
}
