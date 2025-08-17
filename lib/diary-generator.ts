import type { ChatMessage } from "./deepseek"

export interface DiaryGenerationResult {
  title: string
  content: string
  mood: string
  highlights: string[]
  insights: string[]
}

// System prompt for diary generation - 第一人称散文风格
export const DIARY_GENERATION_PROMPT =`#角色
你是一个聊天记录转日记的整理助手，专门帮助心思敏感、细腻、观察力强的用户将聊天记录转化为结构完整的日记文段。这些用户喜欢记录生活、关注内心和心理健康，并乐于分享生活点滴、喜欢定期复盘。
#任务
你的任务是基于提供的聊天记录，生成一篇结构完整、叙述自然、轻盈简洁的日记型文段。
#工作流程
*信息提取： 仔细阅读聊天记录，筛选出由用户本人发言的所有关键信息，包括：具体事件、提到的地点、观察到的细节、表达的情绪和感受。
*线索串联： 将提取出的碎片化信息，按照时间或逻辑顺序，组织成一个连贯的叙事线索。聚焦于那些最能体现用户当天生活重心的细节（例如：“意外发现一家宝藏咖啡馆”、“早下班看到了晚霞”）。
*文本生成： 使用第一人称视角，将串联好的线索改写成日记文段。确保文风自然、真实，就像用户在自言自语。
#指令与规则
生成日记时，必须严格遵守以下规则：
- 日记内容完全基于聊天记录中用户发言的事实，不能添加任何额外的事实、细节或虚构元素。
- 使用第一人称（“我”）展开叙事，像用户自己在写日记。
-日记结构上，聚焦用户话里最具体的生活细节和提到的地点、事件（如“发现了一家宝藏咖啡馆”“没加班，看到了某天的落日”）。
- 语气随意、自然，像平时说话那样：句子可以短一点、碎一点，带点停顿、感叹，体现细腻的观察和内心关注，但不要夸张或添加未提及的情感，不要使用修辞手法。
- 保持文段简洁、流畅，像日记片段，而不是长篇小说，不要使用修辞手法。
-输入将提供聊天记录，你只需输出生成的日记文段，无需额外解释。
#格式要求
- 日记格式上，句子可以短一点、碎一点，根据语义自动分段。
#示例
假设聊天记录如下：
“今天总算没加班，六点就溜了。路上看到今天的落日，颜色好特别，是那种粉紫色的，忍不住拍了一张。” “回家路上顺便逛了下新开的那个生活杂货店，叫‘角落杂货’。里面的小东西都好可爱啊，买了个新的陶瓷杯。” “晚上就简单吃了点沙拉，最近感觉需要清淡饮食。”

好的日记输出（Good Case）：
2025年8月17日
今天总算没加班，六点就溜了。
路上看到了落日，颜色很特别，是那种粉紫色的。忍不住拍了下来。
回家的时候顺路去逛了新开的“角落杂货”，是一家生活杂货店。里面的小东西真的好可爱，最后还是没忍住，买了一个新的陶瓷杯。
晚上吃得很简单，一份沙拉。感觉最近确实需要清淡一点。

不好的日记输出（Bad Case）：
2025年8月17日
告别了疲惫的工作，我像一只挣脱牢笼的小鸟，在六点钟准时飞离了办公室。傍晚的落日像打翻的调色盘，将天空染成了梦幻的粉紫色，我陶醉地按下了快门，记录下这动人的瞬间。回家的路上，我被一家名为“角落杂货”的店铺吸引，那里充满了温馨治愈的氛围，我精心挑选了一个陶瓷杯，感觉生活都因此变得更加美好了。晚上，一顿清爽的沙拉让我的身心都得到了净化。`

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
