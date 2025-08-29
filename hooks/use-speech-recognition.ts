"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxRestartAttempts?: number
}

interface UseSpeechRecognitionResult {
  isSupported: boolean
  isListening: boolean
  interimTranscript: string
  finalTranscript: string
  latestFinalChunk: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  reset: () => void
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const { 
    lang = "zh-CN", 
    continuous = true, 
    interimResults = true,
    maxRestartAttempts = 3
  } = options || {}

  const recognitionRef = useRef<any | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [latestFinalChunk, setLatestFinalChunk] = useState("")
  const [error, setError] = useState<string | null>(null)
  const manualStopRef = useRef(false)
  const restartAttemptsRef = useRef(0)
  const isInitializedRef = useRef(false)

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") return false
    const w = window as any
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
  }, [])

  // 清理函数
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.warn("Speech recognition stop error:", e)
      }
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript("")
    setError(null)
  }, [])

  // 初始化语音识别
  const initializeRecognition = useCallback(() => {
    if (!isSupported || isInitializedRef.current) return

    try {
      const w = window as any
      const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = lang
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      
      // 设置最大备选结果数量，提高识别准确性
      if (recognition.maxAlternatives !== undefined) {
        recognition.maxAlternatives = 1
      }

      recognition.onstart = () => {
        console.log("🎤 Speech recognition started")
        setIsListening(true)
        setInterimTranscript("")
        setLatestFinalChunk("")
        setFinalTranscript("")
        setError(null)
        restartAttemptsRef.current = 0
      }

      recognition.onresult = (event: any) => {
        let interim = ""
        let finalText = ""
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          if (res.isFinal) {
            finalText += res[0].transcript
          } else {
            interim += res[0].transcript
          }
        }
        
        if (interimResults) setInterimTranscript(interim)
        if (finalText) {
          setLatestFinalChunk(finalText)
          setFinalTranscript(prev => prev + finalText)
        }
      }

      recognition.onerror = (e: any) => {
        const errorType = e?.error || "unknown_error"
        console.error("🎤 Speech recognition error:", errorType, e)
        
        // 处理不同类型的错误
        let errorMessage = "语音识别出错"
        switch (errorType) {
          case "no_speech":
            errorMessage = "没有检测到语音"
            break
          case "audio_capture":
            errorMessage = "无法访问麦克风"
            break
          case "not_allowed":
            errorMessage = "麦克风权限被拒绝"
            break
          case "network":
            errorMessage = "网络连接问题"
            break
          case "aborted":
            errorMessage = "语音识别被中断"
            break
          case "service_not_allowed":
            errorMessage = "语音识别服务不可用"
            break
          default:
            errorMessage = `语音识别错误: ${errorType}`
        }
        
        setError(errorMessage)
        setIsListening(false)
      }

      recognition.onend = () => {
        console.log("🎤 Speech recognition ended")
        setIsListening(false)
        
        // 如果不是手动停止且启用了连续模式，尝试重启
        if (!manualStopRef.current && continuous && restartAttemptsRef.current < maxRestartAttempts) {
          restartAttemptsRef.current++
          console.log(`🔄 Attempting to restart speech recognition (${restartAttemptsRef.current}/${maxRestartAttempts})`)
          
          // 延迟重启，避免立即重启导致的问题
          setTimeout(() => {
            if (!manualStopRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (e) {
                console.warn("Failed to restart speech recognition:", e)
                restartAttemptsRef.current = maxRestartAttempts
              }
            }
          }, 100)
        }
      }

      recognitionRef.current = recognition
      isInitializedRef.current = true
      
    } catch (e) {
      console.error("Failed to initialize speech recognition:", e)
      setError("初始化语音识别失败")
    }
  }, [isSupported, lang, continuous, interimResults, maxRestartAttempts])

  useEffect(() => {
    initializeRecognition()
    
    return () => {
      cleanup()
      isInitializedRef.current = false
    }
  }, [initializeRecognition, cleanup])

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      console.warn("Speech recognition not available")
      return
    }
    
    setError(null)
    manualStopRef.current = false
    restartAttemptsRef.current = 0
    
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.warn("Speech recognition start error:", e)
      // 如果启动失败，尝试重新初始化
      cleanup()
      setTimeout(() => {
        initializeRecognition()
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (e2) {
              console.error("Failed to restart speech recognition:", e2)
              setError("启动语音识别失败")
            }
          }
        }, 100)
      }, 100)
    }
  }, [isSupported, cleanup, initializeRecognition])

  const stopListening = useCallback(() => {
    manualStopRef.current = true
    restartAttemptsRef.current = maxRestartAttempts
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.warn("Speech recognition stop error:", e)
      }
    }
  }, [maxRestartAttempts])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const reset = useCallback(() => {
    setInterimTranscript("")
    setFinalTranscript("")
    setLatestFinalChunk("")
    setError(null)
    restartAttemptsRef.current = 0
  }, [])

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    latestFinalChunk,
    error,
    startListening,
    stopListening,
    toggleListening,
    reset,
  }
}


