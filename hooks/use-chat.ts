"use client"

import { useState, useCallback } from "react"
import { getCurrentUser } from "@/lib/auth"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface UseChatReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  conversationId: string | null
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      const requestId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.group(`🚀 [Chat Hook] Sending Message - ${requestId}`)
      console.log("📝 Message content:", content)
      console.log("💬 Current messages count:", messages.length)
      console.log("🔗 Conversation ID:", conversationId)

      const user = getCurrentUser()
      console.log("👤 Current user:", user ? { id: user.id, username: user.username } : "Not logged in")

      if (!user) {
        console.error("❌ [Chat Hook] User not logged in")
        setError("请先登录")
        console.groupEnd()
        return
      }

      const startTime = performance.now()
      console.log("⏱️ Request start time:", new Date().toISOString())

      setIsLoading(true)
      setError(null)

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      }

      console.log("➕ Adding user message:", userMessage)
      setMessages((prev) => {
        console.log("📊 Messages state update - before:", prev.length, "after:", prev.length + 1)
        return [...prev, userMessage]
      })

      try {
        // Prepare messages for API
        const apiMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        console.log("📤 Preparing API request:")
        console.log("  - Messages count:", apiMessages.length)
        console.log("  - Conversation ID:", conversationId)
        console.log("  - User ID:", user.id)
        console.log("  - API Messages:", apiMessages)

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: apiMessages,
            conversationId,
            userId: user.id,
          }),
        })

        const fetchTime = performance.now()
        console.log(`⚡ API response received in ${(fetchTime - startTime).toFixed(2)}ms`)
        console.log("📡 Response status:", response.status, response.statusText)
        console.log("📋 Response headers:", Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }

        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body reader available")
        }

        console.log("🌊 Starting streaming response processing")
        let assistantContent = ""
        let chunkCount = 0
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
        }

        console.log("🤖 Adding empty assistant message:", assistantMessage.id)
        // Add empty assistant message
        setMessages((prev) => {
          console.log("📊 Adding assistant message - total messages:", prev.length + 1)
          return [...prev, assistantMessage]
        })

        while (true) {
          const { done, value } = await reader.read()
          chunkCount++

          if (done) {
            console.log(`✅ Streaming completed after ${chunkCount} chunks`)
            break
          }

          const chunk = decoder.decode(value)
          console.log(`📦 Chunk ${chunkCount}:`, chunk.substring(0, 100) + (chunk.length > 100 ? "..." : ""))

          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              try {
                const parsed = JSON.parse(data)
                console.log("🔍 Parsed streaming data:", parsed)

                if (parsed.type === "conversation_id") {
                  console.log("🆔 Setting conversation ID:", parsed.conversationId)
                  setConversationId(parsed.conversationId)
                } else if (parsed.content) {
                  assistantContent += parsed.content
                  console.log(
                    `📝 Assistant content updated (length: ${assistantContent.length}):`,
                    assistantContent.substring(assistantContent.length - 50),
                  )

                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id === assistantMessage.id) {
                        console.log(`🔄 Updating assistant message ${msg.id}`)
                        return { ...msg, content: assistantContent }
                      }
                      return msg
                    }),
                  )
                }
              } catch (e) {
                console.warn("⚠️ Failed to parse streaming data:", data, e)
              }
            }
          }
        }

        const totalTime = performance.now() - startTime
        console.log(`🎉 Message sending completed successfully in ${totalTime.toFixed(2)}ms`)
        console.log("📊 Final assistant content length:", assistantContent.length)
      } catch (err) {
        const errorTime = performance.now() - startTime
        console.error(`❌ Error occurred after ${errorTime.toFixed(2)}ms:`, err)
        console.error("🔍 Error details:", {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          conversationId,
          messagesCount: messages.length,
        })

        setError(err instanceof Error ? err.message : "An error occurred")
        // Remove the user message if there was an error
        setMessages((prev) => {
          console.log("🗑️ Removing user message due to error")
          return prev.slice(0, -1)
        })
      } finally {
        setIsLoading(false)
        console.log("🏁 Request completed, loading state set to false")
        console.groupEnd()
      }
    },
    [messages, conversationId],
  )

  const clearMessages = useCallback(() => {
    console.group("🧹 [Chat Hook] Clearing Messages")
    console.log("📊 Messages before clear:", messages.length)
    console.log("🔗 Conversation ID before clear:", conversationId)

    setMessages([])
    setConversationId(null)
    setError(null)

    console.log("✅ Messages, conversation ID, and error state cleared")
    console.groupEnd()
  }, [messages.length, conversationId])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    conversationId,
  }
}
