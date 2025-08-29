"use client"

import { Button } from "@/components/ui/button"
import { Mic, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface MicButtonProps {
  isSupported: boolean
  isListening: boolean
  onToggle: () => void
  disabled?: boolean
  className?: string
  pulse?: boolean
}

export function MicButton({ isSupported, isListening, onToggle, disabled, className, pulse }: MicButtonProps) {
  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("w-10 h-10 rounded-full opacity-60 cursor-not-allowed", className)}
        disabled
        title="当前浏览器不支持语音输入"
        aria-label="当前浏览器不支持语音输入"
      >
        <Mic className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      onClick={onToggle}
      variant={isListening ? "default" : "outline"}
      size="icon"
      className={cn(
        "w-10 h-10 rounded-full transition-colors",
        isListening ? "bg-red-500 hover:bg-red-600 text-white" : "",
        (pulse || isListening) ? "animate-pulse" : "",
        className
      )}
      disabled={disabled}
      aria-pressed={isListening}
      aria-label={isListening ? "停止录音" : "点击麦克风开始录音"}
      title={isListening ? "轻触停止" : "点击麦克风开始录音"}
      data-state={isListening ? "listening" : "idle"}
    >
      {isListening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </Button>
  )
}


