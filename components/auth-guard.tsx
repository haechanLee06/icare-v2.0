"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Heart } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  console.log("AuthGuard - user:", user, "loading:", loading)

  useEffect(() => {
    if (!loading && !user) {
      console.log("No user found, redirecting to login")
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF3E0] via-[#F5F5F5] to-[#FFF3E0]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#9F7AEA] rounded-full mb-4 soft-shadow animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#9F7AEA]" />
            <span className="text-[#9F7AEA] font-medium">加载中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
