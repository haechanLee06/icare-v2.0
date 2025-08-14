"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { type User, getCurrentUser, logoutUser } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing user session
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)

    if (currentUser && !document.cookie.includes("user-session=")) {
      document.cookie = `user-session=${currentUser.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    }
  }, [])

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = () => {
    logoutUser()
    setUser(null)
    // Remove cookie
    document.cookie = "user-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/auth/login")
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
