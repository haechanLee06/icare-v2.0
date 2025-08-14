import { type NextRequest, NextResponse } from "next/server"
import { callDeepSeekAPI, analyzeEmotion } from "@/lib/deepseek"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId, userId } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    })

    // Get the latest user message for emotion analysis
    const userMessage = messages[messages.length - 1]
    const emotion = analyzeEmotion(userMessage.content)

    // Save user message to database
    let currentConversationId = conversationId

    if (!currentConversationId) {
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

      if (convError) {
        console.error("Error creating conversation:", convError)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      currentConversationId = conversation.id
    }

    // Save user message
    const { error: userMsgError } = await supabase.from("messages").insert([
      {
        conversation_id: currentConversationId,
        role: "user",
        content: userMessage.content,
        emotion: emotion,
      },
    ])

    if (userMsgError) {
      console.error("Error saving user message:", userMsgError)
    }

    // Call DeepSeek API
    const response = await callDeepSeekAPI(messages)

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

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") {
                  // Save complete assistant message to database
                  if (assistantMessage.trim()) {
                    await supabase.from("messages").insert([
                      {
                        conversation_id: currentConversationId,
                        role: "assistant",
                        content: assistantMessage.trim(),
                      },
                    ])
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

                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content
                    assistantMessage += content
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error)
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
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
