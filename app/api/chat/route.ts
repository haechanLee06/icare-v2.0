import { type NextRequest, NextResponse } from "next/server"
import { callDeepSeekAPI, analyzeEmotion } from "@/lib/deepseek"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  console.log(`[${requestId}] 🚀 Chat API request started at ${new Date().toISOString()}`)

  try {
    const { messages, conversationId, userId } = await request.json()

    console.log(`[${requestId}] 📝 Request details:`, {
      userId,
      conversationId,
      messageCount: messages?.length || 0,
      lastMessagePreview: messages?.[messages.length - 1]?.content?.slice(0, 100) + "...",
    })

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error(`[${requestId}] ❌ Invalid messages array`)
      return NextResponse.json({ error: "Messages are required" }, { status: 400 })
    }

    if (!userId) {
      console.error(`[${requestId}] ❌ Missing user ID`)
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
    console.log(`[${requestId}] 🎭 Analyzing emotion for message: "${userMessage.content.slice(0, 50)}..."`)

    const emotionStartTime = Date.now()
    const emotion = analyzeEmotion(userMessage.content)
    const emotionEndTime = Date.now()

    console.log(`[${requestId}] 🎭 Emotion analysis completed in ${emotionEndTime - emotionStartTime}ms:`, {
      emotion: emotion.emotion,
      intensity: emotion.intensity,
      keywords: emotion.keywords,
    })

    // Save user message to database
    let currentConversationId = conversationId

    if (!currentConversationId) {
      console.log(`[${requestId}] 💬 Creating new conversation`)
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
        console.error(`[${requestId}] ❌ Error creating conversation in ${convEndTime - convStartTime}ms:`, convError)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      currentConversationId = conversation.id
      console.log(
        `[${requestId}] ✅ Conversation created in ${convEndTime - convStartTime}ms, ID: ${currentConversationId}`,
      )
    }

    // Save user message
    console.log(`[${requestId}] 💾 Saving user message to database`)
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

    if (userMsgError) {
      console.error(
        `[${requestId}] ❌ Error saving user message in ${msgSaveEndTime - msgSaveStartTime}ms:`,
        userMsgError,
      )
    } else {
      console.log(`[${requestId}] ✅ User message saved in ${msgSaveEndTime - msgSaveStartTime}ms`)
    }

    // Call DeepSeek API
    console.log(`[${requestId}] 🤖 Calling DeepSeek API with ${messages.length} messages`)
    const apiCallStartTime = Date.now()

    const response = await callDeepSeekAPI(messages, requestId)

    const apiCallEndTime = Date.now()
    console.log(`[${requestId}] 🤖 DeepSeek API call completed in ${apiCallEndTime - apiCallStartTime}ms`)

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          console.error(`[${requestId}] ❌ No reader available from API response`)
          controller.close()
          return
        }

        let assistantMessage = ""
        let chunkCount = 0
        let totalCharsReceived = 0
        const streamStartTime = Date.now()

        console.log(`[${requestId}] 📡 Starting stream processing`)

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              console.log(
                `[${requestId}] 📡 Stream completed after ${chunkCount} chunks, ${totalCharsReceived} characters`,
              )
              break
            }

            const chunk = decoder.decode(value)
            chunkCount++
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") {
                  const streamEndTime = Date.now()
                  console.log(`[${requestId}] 🏁 Stream finished in ${streamEndTime - streamStartTime}ms`)

                  // Save complete assistant message to database
                  if (assistantMessage.trim()) {
                    console.log(`[${requestId}] 💾 Saving assistant message (${assistantMessage.length} chars)`)
                    const assistantSaveStartTime = Date.now()

                    const { error: assistantMsgError } = await supabase.from("messages").insert([
                      {
                        conversation_id: currentConversationId,
                        role: "assistant",
                        content: assistantMessage.trim(),
                      },
                    ])

                    const assistantSaveEndTime = Date.now()

                    if (assistantMsgError) {
                      console.error(
                        `[${requestId}] ❌ Error saving assistant message in ${assistantSaveEndTime - assistantSaveStartTime}ms:`,
                        assistantMsgError,
                      )
                    } else {
                      console.log(
                        `[${requestId}] ✅ Assistant message saved in ${assistantSaveEndTime - assistantSaveStartTime}ms`,
                      )
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
                  console.log(`[${requestId}] ✅ Request completed successfully in ${totalRequestTime}ms`)

                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content
                    assistantMessage += content
                    totalCharsReceived += content.length
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))

                    // Log every 10th chunk to avoid spam
                    if (chunkCount % 10 === 0) {
                      console.log(
                        `[${requestId}] 📡 Processed ${chunkCount} chunks, ${totalCharsReceived} chars received`,
                      )
                    }
                  }
                } catch (e) {
                  console.warn(`[${requestId}] ⚠️ Skipped invalid JSON chunk: ${data.slice(0, 50)}...`)
                }
              }
            }
          }
        } catch (error) {
          const streamErrorTime = Date.now() - streamStartTime
          console.error(`[${requestId}] ❌ Stream error after ${streamErrorTime}ms:`, error)
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
    console.error(`[${requestId}] ❌ Chat API error after ${totalErrorTime}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
