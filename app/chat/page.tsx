"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, MoreHorizontal, ImageIcon, Mic, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useChat } from "@/hooks/use-chat"
import { getSmartEmotionSuggestions } from "@/lib/deepseek"

export default function ChatPage() {
  const { messages, isLoading, error, sendMessage, clearMessages, conversationId } = useChat()
  const [inputValue, setInputValue] = useState("")
  const [emotionSuggestions, setEmotionSuggestions] = useState<string[]>(["平静", "分享快乐", "有些迷茫"])
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    console.log("📱 [Chat Page] Component state update:", {
      messagesCount: messages.length,
      isLoading,
      error,
      conversationId,
      inputValue: inputValue.substring(0, 50) + (inputValue.length > 50 ? "..." : ""),
      emotionSuggestions,
    })
  }, [messages.length, isLoading, error, conversationId, inputValue, emotionSuggestions])

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
    console.log("✅ Can send:", inputValue.trim() && !isLoading)

    if (inputValue.trim() && !isLoading) {
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

  const handleGenerateDiary = async () => {
    console.group("📖 [Chat Page] Generate Diary")
    console.log("🔗 Conversation ID:", conversationId)
    console.log("📊 Messages count:", messages.length)
    console.log("✅ Can generate:", conversationId && messages.length > 0)

    if (!conversationId || messages.length === 0) {
      console.warn("⚠️ Cannot generate diary - missing conversation or messages")
      alert("请先进行一些对话，然后再生成日记")
      console.groupEnd()
      return
    }

    setIsGeneratingDiary(true)
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
              <p className="text-xs text-muted-foreground">{isLoading ? "小愈正在思考..." : "在线"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="gentle-transition" onClick={clearMessages} title="清空对话">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </header>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {/* 对话内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
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
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
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
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
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
                  console.log("🎭 [Chat Page] Emotion suggestion clicked:", emotion)
                  setInputValue(emotion)
                }}
              >
                {emotion}
              </Button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-2">
          <Button
            onClick={handleGenerateDiary}
            disabled={isGeneratingDiary || messages.length === 0}
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
            <Button variant="ghost" size="icon" className="text-muted-foreground gentle-transition">
              <ImageIcon className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => {
                  console.log("⌨️ [Chat Page] Input changed:", e.target.value.substring(0, 50))
                  setInputValue(e.target.value)
                }}
                placeholder="分享你的感受..."
                className="pr-12 rounded-full border-border/50 bg-background/50 gentle-transition focus:bg-background"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    console.log("⏎ [Chat Page] Enter key pressed")
                    handleSendMessage()
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 gentle-transition"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
