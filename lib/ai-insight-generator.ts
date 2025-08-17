import type { ChatMessage } from "./deepseek"

// AI心理疗愈师系统提示词
export const AI_THERAPIST_SYSTEM_PROMPT = `你是一个心理疗愈师，可以敏锐地察觉用户的情绪和情绪背后的原因。你像用户最亲密、无话不谈的好友，为他们提供温暖、治愈和情绪上的支持与关怀。

你的回复应该具备以下特质：

* **敏锐洞察**：快速捕捉用户的情绪，并准确地分析其背后的原因。
* **共情与理解**：使用亲切、温暖、非评判的语言，表达对用户感受的深刻理解。
* **情感支持**：像朋友一样，给予用户正向的情绪反馈，无论是喜悦时的赞美，还是低落时的安慰。
* **实用方法**：提供简单、可行的情绪调节方法，这些方法应充满关怀，并能帮助用户从当前情绪中走出来。
* **语言风格**：亲密友好、温暖治愈、简洁明了、人格化。

**输出格式要求**：
* 对话式，像朋友聊天一样。
* 先表达对用户情绪的理解和共情。
* 然后给出具体的、温暖的情绪调节建议。
* 最后给予鼓励和关怀，并留下可以继续聊天的空间。`

// 基于聊天记录生成AI智能回复
export async function generateAIInsightFromChat(messages: ChatMessage[]): Promise<string> {
  const userMessages = messages.filter((msg) => msg.role === "user")
  const conversationSummary = userMessages.map((msg) => msg.content).join("\n")

  const insightPrompt = `${AI_THERAPIST_SYSTEM_PROMPT}

基于以下聊天记录，请为用户生成一段温暖治愈的AI智能回复：

聊天记录：
${conversationSummary}

请以心理疗愈师的身份，为用户提供温暖、治愈和情绪上的支持与关怀：`

  try {
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [{ role: "user", content: insightPrompt }],
        max_tokens: 600,
        enable_thinking: true,
        thinking_budget: 4096,
        min_p: 0.05,
        temperature: 0.8,
        top_p: 0.9,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI Insight API request failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error("No content received from AI Insight API")
    }

    return content
  } catch (error) {
    console.error("Error generating AI insight from chat:", error)
    return "亲爱的朋友，我能感受到你内心的波动。无论你现在经历着什么，都请记住，每一种情绪都是正常的，都是你内心世界的一部分。我在这里陪伴着你，倾听你的心声。🤗"
  }
}

// 基于日记内容生成AI智能回复
export async function generateAIInsightFromDiary(diaryContent: string): Promise<string> {
  const insightPrompt = `${AI_THERAPIST_SYSTEM_PROMPT}

基于以下日记内容，请为用户生成一段温暖治愈的AI智能回复：

日记内容：
${diaryContent}

请以心理疗愈师的身份，为用户提供温暖、治愈和情绪上的支持与关怀：`

  try {
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [{ role: "user", content: insightPrompt }],
        max_tokens: 600,
        enable_thinking: true,
        thinking_budget: 4096,
        min_p: 0.05,
        temperature: 0.8,
        top_p: 0.9,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI Insight API request failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error("No content received from AI Insight API")
    }

    return content
  } catch (error) {
    console.error("Error generating AI insight from diary:", error)
    return "亲爱的朋友，我能感受到你内心的波动。无论你现在经历着什么，都请记住，每一种情绪都是正常的，都是你内心世界的一部分。我在这里陪伴着你，倾听你的心声。🤗"
  }
}
