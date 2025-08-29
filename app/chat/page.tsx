"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, MoreHorizontal, ImageIcon, Mic, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useChat } from "@/hooks/use-chat"
import { getSmartEmotionSuggestions } from "@/lib/deepseek"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { MicButton } from "@/components/mic-button"
import { VoiceStatusBar } from "@/components/voice-status-bar"

export default function ChatPage() {
  const { messages, isLoading, error, sendMessage, clearMessages, conversationId } = useChat()
  const [inputValue, setInputValue] = useState("")
  const [emotionSuggestions, setEmotionSuggestions] = useState<string[]>(["平静", "分享快乐", "有些迷茫"])
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 语音识别
  const { isSupported, isListening, interimTranscript, latestFinalChunk, error: voiceError, toggleListening } = useSpeechRecognition({ lang: "zh-CN", interimResults: true, continuous: true })

  // 有新的最终片段时，追加到输入框
  useEffect(() => {
    if (latestFinalChunk) {
      setInputValue((v) => (v ? v + " " : "") + latestFinalChunk)
    }
  }, [latestFinalChunk])

  // 检查是否可以发送消息
  const canSendMessage = !isLoading && !isGeneratingDiary && inputValue.trim()
  
  // 检查是否可以生成日记
  const canGenerateDiary = !isLoading && !isGeneratingDiary && conversationId && messages.length > 0

  useEffect(() => {
    console.log("📱 [Chat Page] Component state update:", {
      messagesCount: messages.length,
      isLoading,
      error,
      conversationId,
      inputValue: inputValue.substring(0, 50) + (inputValue.length > 50 ? "..." : ""),
      emotionSuggestions,
      isGeneratingDiary,
      canSendMessage,
      canGenerateDiary,
    })
  }, [messages.length, isLoading, error, conversationId, inputValue, emotionSuggestions, isGeneratingDiary, canSendMessage, canGenerateDiary])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const updateEmotionSuggestions = async () => {
      if (messages.length > 0) {
        console.group("🎭 [Chat Page] Updating Emotion Suggestions")
        console.log("📊 Messages count:", messages.length)

        try {
          const chatMessages = messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))

          console.log("📤 Requesting emotion suggestions for messages:", chatMessages.length)
          const startTime = performance.now()

          const suggestions = await getSmartEmotionSuggestions(chatMessages)

          const duration = performance.now() - startTime
          console.log(`✅ Emotion suggestions received in ${duration.toFixed(2)}ms:`, suggestions)

          setEmotionSuggestions(suggestions)
        } catch (error) {
          console.error("❌ Error updating emotion suggestions:", error)
        } finally {
          console.groupEnd()
        }
      }
    }

    const timeoutId = setTimeout(updateEmotionSuggestions, 1000)
    return () => clearTimeout(timeoutId)
  }, [messages])

  const handleSendMessage = async () => {
    console.group("📨 [Chat Page] Handle Send Message")
    console.log("📝 Input value:", inputValue)
    console.log("🔄 Is loading:", isLoading)
    console.log("✅ Can send:", canSendMessage)

    if (canSendMessage) {
      const messageContent = inputValue
      console.log("🚀 Sending message:", messageContent)

      setInputValue("")
      console.log("🧹 Input cleared")

      await sendMessage(messageContent)
      console.log("✅ Message sent successfully")
    } else {
      console.log("⚠️ Message not sent - invalid conditions")
    }
    console.groupEnd()
  }

  const handleClearMessages = () => {
    setShowClearConfirm(true)
  }

  const confirmClearMessages = () => {
    console.log("🧹 [Chat Page] Confirming clear messages")
    clearMessages()
    setShowClearConfirm(false)
  }

  const handleGenerateDiaryClick = () => {
    if (canGenerateDiary) {
      setShowGenerateConfirm(true)
    }
  }

  const handleGenerateDiary = async () => {
    console.group("📖 [Chat Page] Generate Diary")
    console.log("🔗 Conversation ID:", conversationId)
    console.log("📊 Messages count:", messages.length)
    console.log("✅ Can generate:", canGenerateDiary)

    if (!canGenerateDiary) {
      console.warn("⚠️ Cannot generate diary - invalid conditions")
      console.groupEnd()
      return
    }

    // 获取当前用户信息
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      alert("用户未登录，请重新登录")
      console.error("❌ User not logged in")
      console.groupEnd()
      return
    }

    const user = JSON.parse(userStr)
    console.log("👤 Current user:", user.id)

    setIsGeneratingDiary(true)
    setShowGenerateConfirm(false) // 关闭确认弹窗
    console.log("🔄 Diary generation started")
    const startTime = performance.now()

    try {
      console.log("📤 Sending diary generation request")
      const response = await fetch("/api/diary/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversationId,
          userId: user.id,  // 添加用户ID
        }),
      })

      const fetchTime = performance.now() - startTime
      console.log(`📡 Diary API response received in ${fetchTime.toFixed(2)}ms`)
      console.log("📋 Response status:", response.status, response.ok)

      if (!response.ok) {
        throw new Error(`Diary generation failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log("📄 Diary generation result:", result)

      if (result.success) {
        const totalTime = performance.now() - startTime
        console.log(`🎉 Diary generated successfully in ${totalTime.toFixed(2)}ms`)
        console.log("📖 Generated diary ID:", result.diary.id)
        console.log("🔄 Navigating to diary page")

        router.push(`/diary/${result.diary.id}`)
      } else {
        throw new Error(result.error || "Failed to generate diary")
      }
    } catch (error) {
      const errorTime = performance.now() - startTime
      console.error(`❌ Diary generation error after ${errorTime.toFixed(2)}ms:`, error)
      console.error("🔍 Error details:", {
        message: error instanceof Error ? error.message : String(error),
        conversationId,
        messagesCount: messages.length,
      })

      alert("生成日记失败，请稍后再试")
    } finally {
      setIsGeneratingDiary(false)
      console.log("🏁 Diary generation completed, loading state reset")
      console.groupEnd()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background paper-texture flex flex-col">
        <VoiceStatusBar isSupported={isSupported} isListening={isListening} error={voiceError} />
        {/* 顶部导航 */}
        <header className="flex items-center justify-between p-4 pt-12 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="gentle-transition">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif font-semibold text-foreground">心语对话</h1>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "小愈正在思考..." : isGeneratingDiary ? "正在生成日记..." : "在线"}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="gentle-transition text-muted-foreground hover:text-destructive" 
            onClick={handleClearMessages} 
            title="清空对话"
            disabled={messages.length === 0}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </header>

        {/* 清空对话确认弹窗 */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border/50 rounded-2xl p-6 max-w-sm mx-4 soft-shadow warm-gradient">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-serif font-semibold text-lg text-foreground">确认清空对话</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                这将清空当前所有对话内容，此操作无法撤销。确定要继续吗？
              </p>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowClearConfirm(false)}
                  className="border-border/50 hover:bg-muted/80 gentle-transition"
                >
                  取消
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmClearMessages}
                  className="gentle-transition"
                >
                  确认清空
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 生成日记确认弹窗 */}
        {showGenerateConfirm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border/50 rounded-2xl p-6 max-w-sm mx-4 soft-shadow warm-gradient">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📖</span>
                </div>
                <h3 className="font-serif font-semibold text-lg text-foreground">生成今日心语日记</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                生成日记后，当前对话将结束。确定要基于这次对话生成日记吗？
              </p>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowGenerateConfirm(false)}
                  className="border-border/50 hover:bg-muted/80 gentle-transition"
                >
                  取消
                </Button>
                <Button 
                  onClick={handleGenerateDiary}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gentle-transition"
                >
                  确认生成
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {/* 对话内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src="/avatar.png?height=32&width=32" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">🦊</AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] bg-card border border-border rounded-2xl rounded-tl-md p-3 soft-shadow gentle-transition hover:shadow-md">
                <p className="text-sm leading-relaxed">
                  你好，我是小愈！今天想和我分享什么呢？我在这里静静地听你的情绪故事。
                </p>
                <p className="text-xs mt-2 text-muted-foreground">{formatTime(new Date())}</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src="/avatar.png?height=32&width=32" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">🦊</AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                    : "bg-card border border-border rounded-2xl rounded-tl-md"
                } p-3 soft-shadow gentle-transition hover:shadow-md`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src="/avatar.png?height=32&width=32" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">🦊</AvatarFallback>
              </Avatar>
              <div className="bg-card border border-border rounded-2xl rounded-tl-md p-3 soft-shadow">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">小愈正在思考...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-2">
          <div className="flex gap-2 mb-3">
            <span className="text-xs text-muted-foreground">今天感觉：</span>
            {emotionSuggestions.map((emotion, index) => (
              <Button
                key={`${emotion}-${index}`}
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs rounded-full border-primary/30 text-primary hover:bg-primary/10 gentle-transition bg-transparent"
                onClick={() => {
                  if (!isGeneratingDiary) {
                    console.log("🎭 [Chat Page] Emotion suggestion clicked:", emotion)
                    setInputValue(emotion)
                  }
                }}
                disabled={isGeneratingDiary}
              >
                {emotion}
              </Button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-2">
          <Button
            onClick={handleGenerateDiaryClick}
            disabled={!canGenerateDiary}
            className="w-full h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium rounded-2xl soft-shadow gentle-transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingDiary ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                小愈正在为你写日记...
              </>
            ) : (
              <>📖 生成今日心语日记</>
            )}
          </Button>
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t border-border/50 bg-card/50">
          <div className="flex items-center gap-3">
            {/* 麦克风按钮 - 替换原来的图片图标 */}
            <MicButton
              isSupported={isSupported}
              isListening={isListening}
              onToggle={toggleListening}
              disabled={isLoading || isGeneratingDiary}
              pulse={!inputValue && !isListening}
            />

            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => {
                  console.log("⌨️ [Chat Page] Input changed:", e.target.value.substring(0, 50))
                  setInputValue(e.target.value)
                }}
                placeholder={isGeneratingDiary ? "正在生成日记，请稍候..." : "分享你的感受..."}
                className="pr-12 rounded-full border-border/50 bg-background/50 gentle-transition focus:bg-background"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && canSendMessage) {
                    console.log("⏎ [Chat Page] Enter key pressed")
                    handleSendMessage()
                  }
                }}
                disabled={isLoading || isGeneratingDiary}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 gentle-transition"
                disabled={!canSendMessage}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {isListening ? `正在听你说... ${interimTranscript}` : "点击左侧麦克风开始语音输入"}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
