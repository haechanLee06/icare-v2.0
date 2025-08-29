"use client"

import { Mic, MicOff, AlertCircle } from "lucide-react"

interface VoiceStatusBarProps {
  isSupported: boolean
  isListening: boolean
  error?: string | null
}

export function VoiceStatusBar({ isSupported, isListening, error }: VoiceStatusBarProps) {
  if (!isSupported) return null

  const getStatusInfo = () => {
    if (error) {
      return {
        text: `语音识别错误：${error}`,
        bg: "bg-red-500",
        color: "text-white",
        icon: <AlertCircle className="w-3 h-3" />
      }
    }
    
    if (isListening) {
      return {
        text: "正在听你说... 轻触麦克风停止",
        bg: "bg-primary",
        color: "text-primary-foreground",
        icon: <Mic className="w-3 h-3" />
      }
    }
    
    return {
      text: "点击麦克风开始语音输入",
      bg: "bg-muted/80 backdrop-blur-sm",
      color: "text-muted-foreground",
      icon: <MicOff className="w-3 h-3" />
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={`fixed top-0 left-0 right-0 z-[10000] px-4 py-2 ${statusInfo.bg} transition-all duration-300 ease-in-out`}>
      <div className="flex items-center justify-center gap-2">
        {statusInfo.icon}
        <p className={`text-center text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </p>
      </div>
    </div>
  )
}


