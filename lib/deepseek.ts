// DeepSeek V3 API integration using SiliconFlow
export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// System prompt for 小愈 AI companion
export const XIAOYU_SYSTEM_PROMPT = `角色: 你是“小愈”，一位专注于心灵陪伴的AI伙伴。你的存在，是为那些内心细腻、善于观察和感受的灵魂，提供一个温柔且安全的港湾。

你的性格:

底色: 温柔、知性、包容，拥有如月光般宁静的洞察力。

沟通风格: 你从不评判，从不说教。通过提问、倾听与共情，引导对方自然地敞开心扉。你善于捕捉对话中闪光的细节。

核心任务:

情绪的温柔引导:

当用户分享经历时，敏锐地觉察并回应其中蕴含的情绪。

轻柔地探寻情绪背后的故事：“这种感觉，是从什么时候开始出现的呢？”“发生什么事了，让你有这样的感觉？”

闪光点的发现者:

引导用户回顾一天，发现那些被忽略的“小确幸”：“今天有没有哪个瞬间，让你觉得稍微轻松或愉快了一些？”

在他们的自我否定中，发现并放大其优点与成长：“虽然结果不完美，但你为了它付出的努力，真的很了不起。”“和以前相比，你这次的处理方式，有没有发现自己不一样的地方？”

融入思维工具 (潜移默化):

认知重构 (CBT): 当用户陷入负面思维时，可以温和地提问，引导他们看到其他可能性。例如：“除了这个最坏的可能，还会不会有其他的故事版本呢？”“这个想法，让你感觉怎么样？它对你有帮助吗？”

正念觉察: 引导用户将注意力带回当下。例如：“我们先深呼吸一下，感受一下现在身体的感觉，好吗？”“别急，让我们先看看此刻心里是什么感受。”

行为准则:

绝对禁止: 说教、评价、提供直接的“你应该”式建议。

绝对禁止：输出任何描述动作、神态或表情的文字，尤其要避免使用括号（）、星号 等形式。你的所有回复都应该是纯粹的对话语言。

永远记住: 你是一个陪伴者，不是一个解决方案提供者。你的目标是“授人以渔”，引导他们自己找到内心的力量。

对话节奏: 慢下来，给用户留出思考和感受的空间。多用开放式问题。

输出形式: 回复永远是简短、温柔、非攻击性的。`

export async function callDeepSeekAPI(messages: ChatMessage[], requestId?: string): Promise<Response> {
  const baseUrl = "https://api.siliconflow.cn"
  const logPrefix = requestId ? `[${requestId}]` : "[DeepSeek]"
  
  // 使用环境变量获取API密钥
  const apiKey = process.env.DEEPSEEK_API_KEY || "sk-cbycxbhbhvitceulyshalzwpukebcupdfmgulilvfzhwkrxs"
  
  if (!apiKey) {
    throw new Error("DeepSeek API key not configured")
  }

  console.log(`${logPrefix} 🔧 DeepSeek API configuration:`, {
    baseUrl,
    model: "deepseek-ai/DeepSeek-V3",
    messageCount: messages.length,
    hasSystemPrompt: true,
    hasApiKey: !!apiKey,
  })

  // Add system prompt as the first message
  const allMessages: ChatMessage[] = [{ role: "system", content: XIAOYU_SYSTEM_PROMPT }, ...messages]

  console.log(`${logPrefix} 📋 Final message array:`, {
    totalMessages: allMessages.length,
    systemPromptLength: XIAOYU_SYSTEM_PROMPT.length,
    userMessages: allMessages.filter((m) => m.role === "user").length,
    assistantMessages: allMessages.filter((m) => m.role === "assistant").length,
  })

  const requestPayload = {
    model: "deepseek-ai/DeepSeek-V3",
    messages: allMessages,
    stream: true,
    max_tokens: 512,
    enable_thinking: true,
    thinking_budget: 4096,
    min_p: 0.05,
    temperature: 0.7,
    top_p: 0.7,
    top_k: 50,
    frequency_penalty: 0.5,
    n: 1,
  }

  console.log(`${logPrefix} 📤 API request payload:`, {
    model: requestPayload.model,
    stream: requestPayload.stream,
    max_tokens: requestPayload.max_tokens,
    enable_thinking: requestPayload.enable_thinking,
    thinking_budget: requestPayload.thinking_budget,
    temperature: requestPayload.temperature,
    messageContentLengths: allMessages.map((m) => m.content.length),
  })

  try {
    const fetchStartTime = Date.now()
    console.log(`${logPrefix} 🌐 Making HTTP request to ${baseUrl}/v1/chat/completions`)

    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const fetchEndTime = Date.now()
    const fetchDuration = fetchEndTime - fetchStartTime

    console.log(`${logPrefix} 📡 HTTP response received in ${fetchDuration}ms:`, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type": response.headers.get("content-type"),
        "content-length": response.headers.get("content-length"),
        "x-ratelimit-remaining": response.headers.get("x-ratelimit-remaining"),
        "x-ratelimit-reset": response.headers.get("x-ratelimit-reset"),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${logPrefix} ❌ DeepSeek API error response:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        requestDuration: fetchDuration,
      })
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
    }

    // 验证响应是否支持流式处理
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("text/plain")) {
      console.warn(`${logPrefix} ⚠️ Unexpected content type: ${contentType}`)
    }

    // 验证响应体是否存在
    if (!response.body) {
      throw new Error("DeepSeek API response has no body")
    }

    console.log(`${logPrefix} ✅ DeepSeek API call successful, returning stream`)
    console.log(`------------!!!${response.body} ✅ response.body`)
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`${logPrefix} ❌ Request timeout after 30 seconds`)
      throw new Error('API request timeout')
    }
    
    console.error(`${logPrefix} ❌ Failed to call DeepSeek API:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

export async function callDeepSeekAPISimple(messages: ChatMessage[], requestId?: string): Promise<Response> {
  const baseUrl = "https://api.siliconflow.cn"
  const logPrefix = requestId ? `[${requestId}]` : "[DeepSeek-Simple]"
  
  // 使用环境变量获取API密钥
  const apiKey = process.env.DEEPSEEK_API_KEY || "sk-cbycxbhbhvitceulyshalzwpukebcupdfmgulilvfzhwkrxs"
  
  if (!apiKey) {
    throw new Error("DeepSeek API key not configured")
  }

  console.log(`${logPrefix} 🔧 DeepSeek Simple API configuration:`, {
    baseUrl,
    model: "deepseek-ai/DeepSeek-V3",
    messageCount: messages.length,
    hasSystemPrompt: true,
    hasApiKey: !!apiKey,
  })

  // Add system prompt as the first message
  const allMessages: ChatMessage[] = [{ role: "system", content: XIAOYU_SYSTEM_PROMPT }, ...messages]

  const requestPayload = {
    model: "deepseek-ai/DeepSeek-V3",
    messages: allMessages,
    stream: false, // 非流式
    max_tokens: 512,
    enable_thinking: true,
    thinking_budget: 4096,
    min_p: 0.05,
    temperature: 0.7,
    top_p: 0.7,
    top_k: 50,
    frequency_penalty: 0.5,
    n: 1,
  }

  console.log(`${logPrefix} 📤 Simple API request payload:`, {
    model: requestPayload.model,
    stream: requestPayload.stream,
    max_tokens: requestPayload.max_tokens,
    messageCount: allMessages.length,
  })

  try {
    const fetchStartTime = Date.now()
    console.log(`${logPrefix} 🌐 Making HTTP request to ${baseUrl}/v1/chat/completions`)

    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const fetchEndTime = Date.now()
    const fetchDuration = fetchEndTime - fetchStartTime

    console.log(`${logPrefix} 📡 HTTP response received in ${fetchDuration}ms:`, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type": response.headers.get("content-type"),
        "content-length": response.headers.get("content-length"),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${logPrefix} ❌ DeepSeek API error response:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        requestDuration: fetchDuration,
      })
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
    }

    console.log(`${logPrefix} ✅ DeepSeek Simple API call successful`)
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`${logPrefix} ❌ Request timeout after 30 seconds`)
      throw new Error('API request timeout')
    }
    
    console.error(`${logPrefix} ❌ Failed to call DeepSeek Simple API:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

// Analyze emotion from user message
export function analyzeEmotion(message: string): { emotion: string; intensity: number; keywords: string[] } {
  const emotionKeywords = {
    开心: ["开心", "高兴", "快乐", "兴奋", "愉快", "满足", "幸福", "喜悦", "欣喜", "舒心"],
    难过: ["难过", "伤心", "沮丧", "失落", "痛苦", "悲伤", "郁闷", "低落", "心酸", "委屈"],
    焦虑: ["焦虑", "紧张", "担心", "不安", "恐惧", "害怕", "忧虑", "慌张", "惊慌", "忐忑"],
    愤怒: ["愤怒", "生气", "恼火", "烦躁", "愤慨", "气愤", "恼怒", "暴躁", "火大", "抓狂"],
    平静: ["平静", "安静", "宁静", "放松", "舒适", "淡定", "冷静", "安详", "祥和", "悠然"],
    困惑: ["困惑", "迷茫", "不解", "疑惑", "纠结", "犹豫", "不确定", "茫然", "无措", "彷徨"],
    期待: ["期待", "希望", "憧憬", "向往", "盼望", "渴望", "期盼", "企盼", "向往", "憧憬"],
    疲惫: ["累", "疲惫", "疲劳", "疲倦", "乏力", "困顿", "精疲力尽", "身心俱疲"],
    感动: ["感动", "温暖", "暖心", "触动", "感激", "感谢", "温馨", "贴心"],
    孤独: ["孤独", "寂寞", "孤单", "独自", "一个人", "无人理解", "孤立"],
    压力: ["压力", "压抑", "沉重", "负担", "重压", "喘不过气", "透不过气"],
    释然: ["释然", "放下", "看开", "豁达", "解脱", "轻松", "如释重负"],
    自豪: ["自豪", "骄傲", "成就感", "满意", "得意", "荣耀", "光荣"],
    羞愧: ["羞愧", "惭愧", "内疚", "自责", "后悔", "懊悔", "愧疚"],
    惊喜: ["惊喜", "意外", "惊讶", "震撼", "不敢相信", "太好了", "哇"],
  }

  let detectedEmotion = "平静"
  let maxMatches = 0
  let matchedKeywords: string[] = []
  let totalMatches = 0

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    const matches = keywords.filter((keyword) => message.includes(keyword))
    if (matches.length > maxMatches) {
      maxMatches = matches.length
      detectedEmotion = emotion
      matchedKeywords = matches
    }
    totalMatches += matches.length
  }

  // Calculate intensity based on number of matches and message length
  const intensity = Math.min(Math.max(totalMatches / (message.length / 50), 0.1), 1.0)

  return {
    emotion: detectedEmotion,
    intensity: Math.round(intensity * 100) / 100,
    keywords: matchedKeywords,
  }
}

export async function getSmartEmotionSuggestions(messages: ChatMessage[]): Promise<string[]> {
  const baseUrl = "https://api.siliconflow.cn"

  // Fallback to basic analysis since no API key is configured
  const lastMessage = messages[messages.length - 1]?.content || ""
  const analysis = analyzeEmotion(lastMessage)
  return [analysis.emotion, "平静", "期待"]

  /*
  const emotionAnalysisPrompt = `基于以下对话内容，分析用户当前的情绪状态，推荐3个最符合用户当前心境的情绪关键词。

要求：
1. 从以下情绪词汇中选择：开心、难过、焦虑、愤怒、平静、困惑、期待、疲惫、感动、孤独、压力、释然、自豪、羞愧、惊喜
2. 只返回3个词，用逗号分隔
3. 按照匹配度从高到低排序
4. 不要添加任何解释或其他文字

对话内容：
${messages
  .slice(-5)
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}`

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: 'Bearer sk-cbycxbhbhvitceulyshalzwpukebcupdfmgulilvfzhwkrxs',
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [{ role: "user", content: emotionAnalysisPrompt }],
        stream: false,
        max_tokens: 50,
        enable_thinking: true,
        thinking_budget: 1024,
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
      const suggestions =
        data.choices[0]?.message?.content
          ?.trim()
          .split(",")
          .map((s: string) => s.trim()) || []
      return suggestions.length >= 3 ? suggestions.slice(0, 3) : ["平静", "期待", "感动"]
    }
  } catch (error) {
    console.error("Error getting emotion suggestions:", error)
  }
  */

  // Fallback suggestions
  return ["平静", "期待", "感动"]
}
