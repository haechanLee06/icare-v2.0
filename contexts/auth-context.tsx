"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { type User, getCurrentUser, logoutUser, validateUserSession } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 验证用户会话
  const validateSession = async (userData: User) => {
    try {
      const validatedUser = await validateUserSession(userData.id.toString())
      if (validatedUser) {
        console.log("Session validated successfully:", validatedUser)
        return validatedUser
      } else {
        console.warn("Session validation failed, clearing user data")
        logoutUser()
        return null
      }
    } catch (error) {
      console.error("Session validation error:", error)
      logoutUser()
      return null
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      setLoading(true)
      const currentUser = getCurrentUser()
      console.log("Refreshing user data:", currentUser)
      
      if (currentUser) {
        const validatedUser = await validateSession(currentUser)
        setUser(validatedUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing authentication...")
        
        // 检查localStorage中的用户数据
        const currentUser = getCurrentUser()
        console.log("AuthContext - getCurrentUser result:", currentUser)
        
        if (currentUser) {
          // 验证用户会话
          const validatedUser = await validateSession(currentUser)
          setUser(validatedUser)
          
          // 设置cookie（如果不存在）
          if (validatedUser && !document.cookie.includes("user-session=")) {
            document.cookie = `user-session=${validatedUser.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
            console.log("Set user session cookie")
          }
        } else {
          console.log("No user found in localStorage")
          setUser(null)
        }
      } catch (error) {
        console.error("Authentication initialization error:", error)
        setUser(null)
      } finally {
        setLoading(false)
        console.log("Authentication initialization completed. User:", user, "Loading:", loading)
      }
    }

    initializeAuth()
  }, [])

  // 监听localStorage变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" && e.newValue !== e.oldValue) {
        console.log("localStorage user data changed, refreshing...")
        refreshUser()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const login = (userData: User) => {
    console.log("Login called with user:", userData)
    setUser(userData)
    
    // 设置cookie
    document.cookie = `user-session=${userData.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    console.log("User logged in and cookie set")
  }

  const logout = () => {
    console.log("Logout called")
    logoutUser()
    setUser(null)
    // Remove cookie
    document.cookie = "user-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/auth/login")
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser
  }

  console.log("AuthContext render - user:", user, "loading:", loading)

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
