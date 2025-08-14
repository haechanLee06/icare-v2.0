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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const updateEmotionSuggestions = async () => {
      if (messages.length > 0) {
        try {
          const chatMessages = messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
          const suggestions = await getSmartEmotionSuggestions(chatMessages)
          setEmotionSuggestions(suggestions)
        } catch (error) {
          console.error("Error updating emotion suggestions:", error)
        }
      }
    }

    // 延迟更新，避免频繁调用
    const timeoutId = setTimeout(updateEmotionSuggestions, 1000)
    return () => clearTimeout(timeoutId)
  }, [messages])

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const messageContent = inputValue
      setInputValue("")
      await sendMessage(messageContent)
    }
  }

  const handleGenerateDiary = async () => {
    if (!conversationId || messages.length === 0) {
      alert("请先进行一些对话，然后再生成日记")
      return
    }

    setIsGeneratingDiary(true)
    try {
      const response = await fetch("/api/diary/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate diary")
      }

      const result = await response.json()
      if (result.success) {
        // 跳转到生成的日记页面
        router.push(`/diary/${result.diary.id}`)
      } else {
        throw new Error(result.error || "Failed to generate diary")
      }
    } catch (error) {
      console.error("Error generating diary:", error)
      alert("生成日记失败，请稍后再试")
    } finally {
      setIsGeneratingDiary(false)
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
              <h1 className="font-serif font-semibold text-foreground">心语对话1</h1>
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
                key={`${emotion}-${index}`} // 使用emotion和index组合作为key，避免重复key警告
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs rounded-full border-primary/30 text-primary hover:bg-primary/10 gentle-transition bg-transparent"
                onClick={() => setInputValue(emotion)}
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
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="分享你的感受..."
                className="pr-12 rounded-full border-border/50 bg-background/50 gentle-transition focus:bg-background"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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

            <Button variant="ghost" size="icon" className="text-muted-foreground gentle-transition">
              <Mic className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
