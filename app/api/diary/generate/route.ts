import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateDiary, analyzeDiaryMood } from "@/lib/diary-generator"
import type { ChatMessage } from "@/lib/deepseek"
import { analyzeWithDeepSeek } from "@/lib/deepseek"
import { generateAIInsight } from "@/lib/ai-insight-generator"
import { cleanAIResponse } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const { conversationId, userId } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error("Auth error: User not found or invalid user ID")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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

    // 第一步：生成AI情绪洞察
    console.log("开始生成AI情绪洞察...")
    let aiInsight = ""
    try {
      aiInsight = await generateAIInsight({
        title,
        content: diaryContent,
        emotion,
        conversationContext: "用户与AI的深度对话"
      })
      console.log("✅ AI情绪洞察生成成功:", aiInsight)
    } catch (insightError) {
      console.error("❌ 生成AI洞察失败:", insightError)
      return NextResponse.json({ 
        error: "AI情绪洞察生成失败，请稍后重试" 
      }, { status: 500 })
    }

    // 第二步：进行AI情绪分析
    console.log("开始AI情绪分析...")
    let moodScore = null
    let emotionKeywords: string[] = []
    let eventKeywords: string[] = []
    
    try {
      // 构建情绪分析提示词
      const emotionAnalysisPrompt = `
# 角色
你是一个专业的情绪分析师和文本信息提取专家。

# 任务
你的任务是基于用户提供的文本记录，进行深入的情绪分析，并以严格的 JSON 格式输出三个关键信息：心情指数、心情关键词和事件关键词。

# 指令与规则
1.  **心情指数 (mood_score)**:
    * 对文本中表达的整体情绪强度进行评分，分值为 1-10 的整数。
    * 评分标准：1 代表极度负面情绪（如：绝望、崩溃），5 代表中性或复杂情绪（如：平静、迷茫、悲喜交加），10 代表极度正面情绪（如：狂喜、极度兴奋）。
    * 评分必须是整数。

2.  **心情关键词 (emotion_keywords)**:
    * 从文本中提取能直接或间接描述情绪状态的词语或短语。
    * 这些词应该聚焦于"感受"，例如"开心"、"崩溃"、"燃起来"、"心如刀割"、"松了一口气"等。
    * 结果必须是一个 JSON 字符串数组。

3.  **事件关键词 (event_keywords)**:
    * 从文本中提取引发上述情绪的客观"事件"、"原因"或"对象"。
    * 这些词应该聚焦于"事实"，即"发生了什么事"，例如"收到录取通知书"、"项目搞砸了"、"和朋友吵架"、"考试通过"等。
    * 结果必须是一个 JSON 字符串数组。

4.  **输出格式**:
    * 你必须且只能输出一个严格的、不包含任何额外解释说明的 JSON 对象。
    * JSON 对象的键必须使用英文：\`mood_score\`, \`emotion_keywords\`, \`event_keywords\`。
    * 不要包含任何markdown格式标记，直接输出纯JSON。

请分析以下日记内容：

日记标题：${title}
日记内容：${diaryContent}
用户情绪标签：${emotion}

请返回JSON格式的分析结果。`

      // 调用DeepSeek API进行分析
      const aiResponse = await analyzeWithDeepSeek(emotionAnalysisPrompt)
      
      if (aiResponse) {
        try {
          // 清理AI返回的响应，移除可能的markdown格式标记
          const cleanResponse = cleanAIResponse(aiResponse)
          
          // 尝试解析AI返回的JSON
          const analysisResult = JSON.parse(cleanResponse)
          
          // 验证数据格式
          if (analysisResult.mood_score && analysisResult.emotion_keywords && analysisResult.event_keywords) {
            console.log("✅ AI情绪分析完成:", analysisResult)
            
            moodScore = analysisResult.mood_score
            emotionKeywords = analysisResult.emotion_keywords
            eventKeywords = analysisResult.event_keywords
          } else {
            console.warn("⚠️ AI返回的数据格式不正确:", analysisResult)
            throw new Error("AI返回的数据格式不正确")
          }
        } catch (parseError) {
          console.error("❌ 解析AI返回结果失败:", parseError)
          console.log("AI原始返回:", aiResponse)
          throw new Error("AI情绪分析结果解析失败")
        }
      } else {
        console.warn("⚠️ AI情绪分析失败")
        throw new Error("AI情绪分析失败")
      }
    } catch (analysisError) {
      console.error("❌ AI情绪分析过程中出错:", analysisError)
      return NextResponse.json({ 
        error: "AI情绪分析失败，请稍后重试" 
      }, { status: 500 })
    }

    // 第三步：两个AI调用都成功后，保存日记到数据库
    console.log("两个AI调用都成功，开始保存日记...")
    const { data: diaryEntry, error: saveError } = await supabase
      .from("diary_entries")
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        title,
        content: diaryContent,
        emotion,
        ai_insight: aiInsight,
        mood_score: moodScore,
        emotion_keywords: emotionKeywords,
        event_keywords: eventKeywords,
        mood_tags: [emotion, "生活感悟", "内心成长"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ai_analysis_updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error("❌ 保存日记失败:", saveError)
      return NextResponse.json({ error: "Failed to save diary" }, { status: 500 })
    }

    console.log("✅ 日记保存成功，ID:", diaryEntry.id)

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
