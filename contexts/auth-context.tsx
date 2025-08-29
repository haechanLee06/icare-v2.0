"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { type User, getCurrentUser, logoutUser, validateUserSession } from "@/lib/auth"
import { Loader2 } from "lucide-react"

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
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  // 验证用户会话
  const validateSession = useCallback(async (userData: User) => {
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
  }, [])

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
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
  }, [validateSession])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("Initializing authentication...")
        
        // 检查localStorage中的用户数据
        const currentUser = getCurrentUser()
        console.log("AuthContext - getCurrentUser result:", currentUser)
        
        if (currentUser && mounted) {
          // 验证用户会话
          const validatedUser = await validateSession(currentUser)
          if (mounted) {
            setUser(validatedUser)
          }
          
          // 移除cookie设置，仅使用localStorage
          console.log("User session initialized from localStorage")
        } else if (mounted) {
          console.log("No user found in localStorage")
          setUser(null)
        }
      } catch (error) {
        console.error("Authentication initialization error:", error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
          console.log("Authentication initialization completed. User:", user, "Loading:", loading)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [validateSession])

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
  }, [refreshUser])

  const login = useCallback((userData: User) => {
    console.log("Login called with user:", userData)
    setUser(userData)
    
    // 移除cookie设置，仅使用localStorage
    console.log("User logged in successfully")
  }, [])

  const logout = useCallback(() => {
    console.log("Logout called")
    logoutUser()
    setUser(null)
    // 移除cookie清理代码
    router.push("/auth/login")
  }, [router])

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser
  }

  // 只在初始化完成后渲染
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF3E0] via-[#F5F5F5] to-[#FFF3E0]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#9F7AEA] rounded-full mb-4 soft-shadow animate-pulse">
            <div className="w-8 h-8 text-white text-2xl">❤</div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#9F7AEA]" />
            <span className="text-[#9F7AEA] font-medium">初始化中...</span>
          </div>
        </div>
      </div>
    )
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
