import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateDiary, analyzeDiaryMood } from "@/lib/diary-generator"
import { generateAIInsightFromChat } from "@/lib/ai-insight-generator"
import type { ChatMessage } from "@/lib/deepseek"

export async function POST(request: NextRequest) {
  try {
    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const userSessionCookie = request.cookies.get("user-session")
    if (!userSessionCookie) {
      console.error("Auth error: Auth session missing!")
      return NextResponse.json({ error: "Auth session missing!" }, { status: 401 })
    }

    const userId = userSessionCookie.value

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error("Auth error: Invalid user session")
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 })
    }

    // Fetch conversation messages
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("Error fetching messages:", messagesError)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages found" }, { status: 404 })
    }

    // Convert to ChatMessage format
    const chatMessages: ChatMessage[] = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    let diaryContent: string
    let emotion: string

    try {
      diaryContent = await generateDiary(chatMessages)
      emotion = await analyzeDiaryMood(diaryContent)
    } catch (diaryError) {
      console.error("Error in diary generation:", diaryError)
      diaryContent = `今天我与小愈进行了一次深入的对话。通过这次交流，我感受到了内心的变化和成长。

这些对话让我更好地理解了自己的情绪，也让我学会了如何更好地表达内心的感受。每一次的交流都是一次心灵的成长。

愿我能继续保持这份对内心世界的关注，在生活中找到更多的美好与平静。`
      emotion = "平静"
    }

    // Generate title based on content
    const title = `${new Date().toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
    })}心语`

    // Generate AI insight based on chat messages
    let aiInsight: string
    try {
      aiInsight = await generateAIInsightFromChat(chatMessages)
    } catch (insightError) {
      console.error("Error generating AI insight:", insightError)
      aiInsight = `基于我们的对话，我为你生成了这篇日记。你的文字中透露出${emotion}的情绪，这种感受值得被记录和珍惜。`
    }

    // Save diary entry to database
    const { data: diaryEntry, error: saveError } = await supabase
      .from("diary_entries")
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        title,
        content: diaryContent,
        emotion,
        ai_insight: aiInsight,
        mood_tags: [emotion, "生活感悟", "内心成长"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving diary:", saveError)
      return NextResponse.json({ error: "Failed to save diary" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      diary: {
        id: diaryEntry.id,
        title,
        content: diaryContent,
        emotion, // 返回emotion而不是mood
        created_at: diaryEntry.created_at,
      },
    })
  } catch (error) {
    console.error("Error generating diary:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
