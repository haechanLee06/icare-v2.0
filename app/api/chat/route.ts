import { type NextRequest, NextResponse } from "next/server"
import { callDeepSeekAPI, analyzeEmotion } from "@/lib/deepseek"
import { generateAIInsightFromChat } from "@/lib/ai-insight-generator"
import { createServerClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  console.log(`[${requestId}] 🚀 Chat API request started at ${new Date().toISOString()}`)

  try {
    const { messages, conversationId, userId } = await request.json()


    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
      },
    )

    // Get the latest user message for emotion analysis
    const userMessage = messages[messages.length - 1]
    const emotionStartTime = Date.now()
    const emotion = analyzeEmotion(userMessage.content)
    const emotionEndTime = Date.now()

    // Save user message to database
    let currentConversationId = conversationId

    if (!currentConversationId) {
      const convStartTime = Date.now()

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert([
          {
            user_id: userId,
            title: userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? "..." : ""),
          },
        ])
        .select()
        .single()

      const convEndTime = Date.now()

      if (convError) {
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      currentConversationId = conversation.id
    }

    // Save user message
    const msgSaveStartTime = Date.now()

    const { error: userMsgError } = await supabase.from("messages").insert([
      {
        conversation_id: currentConversationId,
        role: "user",
        content: userMessage.content,
        emotion: emotion,
      },
    ])

    const msgSaveEndTime = Date.now()

    // Call DeepSeek API
    const apiCallStartTime = Date.now()

    const response = await callDeepSeekAPI(messages, requestId)

    const apiCallEndTime = Date.now()

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let assistantMessage = ""
        let chunkCount = 0
        let totalCharsReceived = 0
        let lastChunkTime = Date.now()
        let buffer = "" // 添加缓冲区处理不完整的chunk
        const streamStartTime = Date.now()


        try {
          while (true) {
            // 检查流式响应超时
            const now = Date.now()
            if (now - lastChunkTime > 15000) { // 15秒超时
              break
            }

            const { done, value } = await reader.read()
            if (done) {
              break
            }

            chunkCount++
            lastChunkTime = Date.now()

            // 防止无限循环
            if (chunkCount > 1000) {
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk // 添加到缓冲区

            // 处理缓冲区中的完整行
            const lines = buffer.split("\n")
            buffer = lines.pop() || "" // 保留最后一行（可能不完整）

            for (const line of lines) {
              if (line.trim() === "") continue // 跳过空行
              
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim()
                
                if (data === "[DONE]") {
                  const streamEndTime = Date.now()

                  // Save complete assistant message to database
                  if (assistantMessage.trim()) {
                    const assistantSaveStartTime = Date.now()

                    const { error: assistantMsgError } = await supabase.from("messages").insert([
                      {
                        conversation_id: currentConversationId,
                        role: "assistant",
                        content: assistantMessage.trim(),
                      },
                    ])

                    const assistantSaveEndTime = Date.now()

                    // Generate AI insight after conversation is complete
                    try {
                      const allMessages = await supabase
                        .from("messages")
                        .select("role, content")
                        .eq("conversation_id", currentConversationId)
                        .order("created_at", { ascending: true })

                      if (allMessages.data && allMessages.data.length > 0) {
                        const chatMessages = allMessages.data.map((msg) => ({
                          role: msg.role as "user" | "assistant",
                          content: msg.content,
                        }))

                        const aiInsight = await generateAIInsightFromChat(chatMessages)
                        
                        // Update the conversation with AI insight
                        await supabase
                          .from("conversations")
                          .update({ ai_insight: aiInsight })
                          .eq("id", currentConversationId)
                      }
                    } catch (insightError) {
                      console.error("Error generating AI insight:", insightError)
                    }
                  }

                  // Send conversation ID in the final chunk
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        conversationId: currentConversationId,
                        type: "conversation_id",
                      })}\n\n`,
                    ),
                  )

                  const totalRequestTime = Date.now() - requestStartTime
                
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content
                    assistantMessage += content
                    totalCharsReceived += content.length
                    
                    // 发送内容到客户端
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))

                    // Log every 10th chunk to avoid spam

                  }
                } catch (e) {
                  // 只记录非空数据的解析错误
                  if (data && data !== "[DONE]" && data.trim() !== "") {
                   
                  }
                }
              }
            }
          }
        } catch (error) {
          const streamErrorTime = Date.now() - streamStartTime
        
          
          // 发送错误信息到客户端
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Stream processing error",
                message: error instanceof Error ? error.message : "Unknown error",
              })}\n\n`,
            ),
          )
          
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    const totalErrorTime = Date.now() - requestStartTime
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
