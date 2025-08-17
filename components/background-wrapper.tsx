"use client"

import { ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"

interface BackgroundWrapperProps {
  children: ReactNode
  className?: string
}

export function BackgroundWrapper({ children, className = "" }: BackgroundWrapperProps) {
  const { user } = useAuth()
  
  // 如果用户未登录，不显示背景图片
  if (!user) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <div className={`background-image min-h-screen ${className}`}>
      {children}
    </div>
  )
}

// 导出不同的背景样式变体
export function WarmBackground({ children, className = "" }: BackgroundWrapperProps) {
  const { user } = useAuth()
  
  if (!user) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <div className={`background-image min-h-screen warm-gradient ${className}`}>
      {children}
    </div>
  )
}

export function PaperBackground({ children, className = "" }: BackgroundWrapperProps) {
  const { user } = useAuth()
  
  if (!user) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <div className={`background-image min-h-screen paper-texture ${className}`}>
      {children}
    </div>
  )
}
