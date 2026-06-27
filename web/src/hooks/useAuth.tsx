'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { ApiError, getMe, resyncRoles, syncSession, type HubUser, type UserPermissions } from '@/lib/api'
import { getSiteUrl, supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: HubUser | null
  permissions: UserPermissions | null
  loading: boolean
  syncing: boolean
  error: string | null
  signInWithDiscord: () => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  requestRoleResync: () => Promise<void>
  retryIdentitySync: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<HubUser | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const syncWithApi = useCallback(async (accessToken: string, isInitial = false) => {
    setSyncing(true)
    setError(null)
    try {
      const data = isInitial
        ? await syncSession(accessToken)
        : await getMe(accessToken)
      setUser(data.user)
      setPermissions(data.permissions)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'LAUNCH_LOCKED') {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Sync API échouée')
      }
      setUser(null)
      setPermissions(null)
    } finally {
      setSyncing(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) {
      await syncWithApi(data.session.access_token, false)
    }
  }, [syncWithApi])

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (newSession?.access_token) {
        setLoading(false)
        const isInitial = event === 'INITIAL_SESSION' || event === 'SIGNED_IN'
        void syncWithApi(newSession.access_token, isInitial)
      } else {
        setUser(null)
        setPermissions(null)
        setLoading(false)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [syncWithApi])

  const signInWithDiscord = useCallback(async () => {
    setError(null)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback/`,
      },
    })
    if (authError) setError(authError.message)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setPermissions(null)
    setSession(null)
  }, [])

  const requestRoleResync = useCallback(async () => {
    if (!session?.access_token) return
    await resyncRoles(session.access_token)
    setTimeout(() => refresh(), 3000)
  }, [session, refresh])

  const retryIdentitySync = useCallback(async () => {
    if (!session?.access_token) return
    setSyncing(true)
    setError(null)
    try {
      await syncSession(session.access_token)
      await resyncRoles(session.access_token)
      await new Promise((r) => setTimeout(r, 2500))
      await syncWithApi(session.access_token, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync échouée')
      throw err
    } finally {
      setSyncing(false)
    }
  }, [session, syncWithApi])

  const value = useMemo(
    () => ({
      session,
      user,
      permissions,
      loading,
      syncing,
      error,
      signInWithDiscord,
      signOut,
      refresh,
      requestRoleResync,
      retryIdentitySync,
    }),
    [
      session,
      user,
      permissions,
      loading,
      syncing,
      error,
      signInWithDiscord,
      signOut,
      refresh,
      requestRoleResync,
      retryIdentitySync,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
