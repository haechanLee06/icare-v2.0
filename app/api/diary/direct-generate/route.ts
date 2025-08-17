import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateAIInsightFromDiary } from "@/lib/ai-insight-generator"

export async function POST(request: NextRequest) {
  try {
    const { content, title, emotion } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "日记内容不能为空" }, { status: 400 })
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

    // Generate AI insight based on diary content
    let aiInsight: string
    try {
      aiInsight = await generateAIInsightFromDiary(content)
    } catch (insightError) {
      console.error("Error generating AI insight:", insightError)
      aiInsight = `基于你的日记内容，我感受到了你内心的波动。你的文字中透露出${emotion || "丰富"}的情绪，这种感受值得被记录和珍惜。`
    }

    // Generate title if not provided
    const diaryTitle = title || `${new Date().toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
    })}心语`

    // Save diary entry to database
    const { data: diaryEntry, error: saveError } = await supabase
      .from("diary_entries")
      .insert({
        user_id: user.id,
        title: diaryTitle,
        content: content,
        emotion: emotion || "平静",
        ai_insight: aiInsight,
        mood_tags: [emotion || "平静", "生活感悟", "内心成长"],
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
        title: diaryTitle,
        content: content,
        emotion: emotion || "平静",
        ai_insight: aiInsight,
        created_at: diaryEntry.created_at,
      },
    })
  } catch (error) {
    console.error("Error generating diary directly:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
