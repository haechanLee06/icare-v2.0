import type { ChatMessage } from "./deepseek"

export interface DiaryGenerationResult {
  title: string
  content: string
  mood: string
  highlights: string[]
  insights: string[]
}

// System prompt for diary generation - 第一人称散文风格
export const DIARY_GENERATION_PROMPT = `你是一位温柔细腻的文字工作者，擅长将日常对话转化为治愈人心的散文日记。

请基于用户的聊天内容，以第一人称视角写一篇今日心语日记。要求：

写作风格：
• 使用第一人称"我"来叙述
• 散文风格，文字优美但不过于抽象
• 减少"的"字使用，让句子更加流畅自然
• 笔触细腻，能够治愈读者心灵
• 长度控制在200-300字

内容要求：
• 总结今日情绪变化和心境
• 记录生活中发生的具体事情
• 发现并强调生活里的美好瞬间
• 捕捉成长过程中的高光时刻
• 给出温柔的自我建议和鼓励

请直接返回日记内容，不要添加标题或其他格式。用温暖、治愈的语调，让读者感受到生活的美好。`

export async function generateDiary(messages: ChatMessage[]): Promise<string> {
  // 提取用户消息内容用于分析
  const userMessages = messages.filter((msg) => msg.role === "user")
  const conversationSummary = userMessages.map((msg) => msg.content).join("\n")

  const diaryPrompt = `${DIARY_GENERATION_PROMPT}

今日对话内容：
${conversationSummary}

请为我写一篇今日心语日记：`

  try {
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [{ role: "user", content: diaryPrompt }],
        max_tokens: 800,
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
      const errorText = await response.text()
      console.error(`API request failed: ${response.status} - ${errorText}`)
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error("No content received from API")
    }

    return content
  } catch (error) {
    console.error("Error generating diary:", error)
    return "今天我与内心进行了一场深度对话。在这个安静的时刻，我感受到了生活中那些细微而珍贵的美好。每一次思考都让我更加了解自己，每一份感受都值得被温柔对待。愿明天的我能带着今日的收获，继续前行。"
  }
}

export async function analyzeDiaryMood(content: string): Promise<string> {
  const moodAnalysisPrompt = `请分析以下日记内容的整体情绪基调，从以下选项中选择一个最符合的：
开心、平静、感动、期待、释然、自豪、温暖、充实、感恩、希望

只返回一个词，不要其他内容。

日记内容：
${content}`

  try {
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [{ role: "user", content: moodAnalysisPrompt }],
        max_tokens: 10,
        enable_thinking: true,
        thinking_budget: 4096,
        min_p: 0.05,
        temperature: 0.3,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const mood = data.choices?.[0]?.message?.content?.trim()
      return mood || "平静"
    }
  } catch (error) {
    console.error("Error analyzing mood:", error)
  }

  return "平静"
}
