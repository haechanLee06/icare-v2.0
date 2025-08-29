"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
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
  const { lang = "zh-CN", continuous = true, interimResults = true } = options || {}

  const recognitionRef = useRef<any | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [latestFinalChunk, setLatestFinalChunk] = useState("")
  const [error, setError] = useState<string | null>(null)
  const manualStopRef = useRef(false)

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") return false
    const w = window as any
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
  }, [])

  useEffect(() => {
    if (!isSupported) return
    const w = window as any
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = interimResults

    recognition.onstart = () => {
      setIsListening(true)
      setInterimTranscript("")
      setLatestFinalChunk("")
      setFinalTranscript("")
      setError(null)
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
      const message = e?.error || "unknown_error"
      setError(message)
    }

    recognition.onend = () => {
      setIsListening(false)
      // 若不是手动停止，自动重启以实现持续识别（适配 iOS Safari 的短段 onend）
      if (!manualStopRef.current) {
        try {
          recognition.start()
        } catch {}
      }
    }

    recognitionRef.current = recognition
    return () => {
      try {
        recognition.stop()
      } catch {}
      recognitionRef.current = null
    }
  }, [isSupported, lang, continuous, interimResults])

  const startListening = useCallback(() => {
    if (!isSupported) return
    setError(null)
    manualStopRef.current = false
    try {
      recognitionRef.current?.start()
    } catch (e) {
      // Some browsers throw on multiple starts
      try {
        recognitionRef.current?.stop()
      } catch {}
      recognitionRef.current?.start?.()
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    manualStopRef.current = true
    try {
      recognitionRef.current?.stop()
    } catch {}
  }, [])

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


