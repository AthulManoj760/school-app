import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (data) {
                setProfile(data)
            } else {
                setProfile({
                    id: userId,
                    role: 'admin'
                })
            }
        } catch (err) {
            console.error('Profile fetch failed:', err)
            setProfile({
                id: userId,
                role: 'admin'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let isMounted = true

        // Safety timeout so UI never hangs on loading indefinitely
        const timer = setTimeout(() => {
            if (isMounted) setLoading(false)
        }, 3000)

        // 1. Check existing session on load
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                // Defer to next turn of event loop to prevent Supabase auth lock deadlock
                setTimeout(() => {
                    if (isMounted) fetchProfile(currentUser.id)
                }, 0)
            } else {
                setLoading(false)
            }
        }).catch(() => {
            if (isMounted) setLoading(false)
        })

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return
            const currentUser = session?.user ?? null
            setUser(currentUser)

            if (event === 'SIGNED_OUT' || !currentUser) {
                setProfile(null)
                setLoading(false)
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                // Must NOT await supabase query directly inside onAuthStateChange callback
                // Doing so deadlocks Supabase's internal auth lock
                setTimeout(() => {
                    if (isMounted) fetchProfile(currentUser.id)
                }, 0)
            }
        })

        return () => {
            isMounted = false
            clearTimeout(timer)
            subscription?.unsubscribe()
        }
    }, [])

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) return { error }
            if (data?.user) {
                setUser(data.user)
                setTimeout(() => fetchProfile(data.user.id), 0)
            }
            return { data, error: null }
        } catch (err) {
            return { error: err }
        }
    }

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
        } finally {
            setProfile(null)
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
