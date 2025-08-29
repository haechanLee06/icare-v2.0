"use client"

interface VoiceStatusBarProps {
  isSupported: boolean
  isListening: boolean
  error?: string | null
}

export function VoiceStatusBar({ isSupported, isListening, error }: VoiceStatusBarProps) {
  if (!isSupported) return null

  const text = error
    ? `语音不可用：${error}`
    : isListening
      ? "正在听你说... 轻触麦克风停止"
      : "点击麦克风开始录音"

  const bg = error ? "bg-red-500" : isListening ? "bg-primary" : "bg-muted"
  const color = error ? "text-white" : isListening ? "text-primary-foreground" : "text-muted-foreground"

  return (
    <div className={`fixed top-0 left-0 right-0 z-[10000] px-4 py-2 ${bg}`}>
      <p className={`text-center text-xs ${color}`}>{text}</p>
    </div>
  )
}


