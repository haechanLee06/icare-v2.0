import { analyzeWithDeepSeek } from "./deepseek"

export interface InsightGenerationOptions {
  title: string
  content: string
  emotion?: string
  conversationContext?: string
}

/**
 * 生成AI情绪洞察
 * @param options 洞察生成选项
 * @returns 生成的AI洞察文本
 */
export async function generateAIInsight(options: InsightGenerationOptions): Promise<string> {
  try {
    console.log("开始生成AI情绪洞察")
    
    // 使用优化的AI洞察提示词
    const prompt = buildInsightPrompt(options)
    
    // 调用AI生成洞察
    const insightResponse = await analyzeWithDeepSeek(prompt)
    
    if (insightResponse && insightResponse.trim()) {
      const insight = insightResponse.trim()
      console.log("AI情绪洞察生成成功:", insight)
      return insight
    } else {
      console.warn("AI返回空响应，使用备用模板")
      return generateFallbackInsight(options)
    }
  } catch (error) {
    console.error("生成AI洞察失败:", error)
    return generateFallbackInsight(options)
  }
}

/**
 * 构建AI洞察提示词
 */
function buildInsightPrompt(options: InsightGenerationOptions): string {
  return `你是一个温暖的心理疗愈师，专门为用户提供情绪支持和洞察。

请基于以下日记内容，生成一段温暖、治愈的情绪洞察：

**日记标题：** ${options.title}
**日记内容：** ${options.content}
**用户情绪标签：** ${options.emotion || '未指定'}
${options.conversationContext ? `**对话上下文：** ${options.conversationContext}` : ''}

**要求：**
1. 敏锐捕捉用户的情绪状态和背后的原因
2. 用温暖、亲切的语言表达理解和共情
3. 提供2-3个简单可行的情绪调节建议
4. 给予鼓励和关怀，像朋友一样支持
5. 使用表情符号增加温度（如 🎉、🌧️、❤️、🤗）
6. 控制在100-150字左右

**输出格式：**
- 对话式，像朋友聊天
- 先表达理解和共情
- 然后给出具体建议
- 最后给予鼓励

请生成一段温暖而专业的情绪洞察分析。`
}

/**
 * 生成备用洞察模板
 */
function generateFallbackInsight(options: InsightGenerationOptions): string {
  return `你记录了${options.emotion || '丰富'}的心情。${options.content.length > 50 ? '这是一篇详细的记录，' : ''}保持记录的习惯，让每一次情绪波动都成为成长的轨迹。`
}

/**
 * 为现有日记生成或更新AI洞察
 */
export async function updateExistingDiaryInsight(
  diaryId: number,
  userId: number,
  title: string,
  content: string,
  emotion?: string
): Promise<string> {
  try {
    const insight = await generateAIInsight({
      title,
      content,
      emotion
    })
    
    return insight
  } catch (error) {
    console.error("更新现有日记洞察失败:", error)
    return generateFallbackInsight({
      title,
      content,
      emotion
    })
  }
}
