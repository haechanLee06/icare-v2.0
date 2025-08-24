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
    
    // 使用通用的AI洞察提示词
    const prompt = buildUniversalInsightPrompt(options)
    
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
 * 构建通用的AI洞察提示词
 */
function buildUniversalInsightPrompt(options: InsightGenerationOptions): string {
  return `
# 角色
你是一个专业的心理咨询师和情绪分析师，专门帮助用户理解自己的情绪状态和内心世界。

# 任务
基于用户提供的日记内容，生成一段温暖、专业且富有洞察力的情绪分析。这段分析应该：
1. 理解并认可用户的情绪感受
2. 提供积极的情绪洞察和成长建议
3. 语言要温暖、亲切，像朋友一样
4. 体现记录的价值和意义

# 要求
- 分析要基于日记的具体内容，不要泛泛而谈
- 语言要温暖、鼓励，避免说教
- 长度控制在100-150字左右
- 要体现对用户情绪的理解和关怀

# 示例风格
"从你的文字中，我感受到了[具体情绪]的波动。这种[情绪描述]是很自然的，[具体分析]。记住，每一次情绪的起伏都是内心在与你对话，[鼓励和建议]。"

请分析以下日记内容：

日记标题：${options.title}
日记内容：${options.content}
用户情绪标签：${options.emotion || '未指定'}
${options.conversationContext ? `对话上下文：${options.conversationContext}` : ''}

请生成一段温暖而专业的情绪洞察分析。`
}

/**
 * 构建分析型洞察的提示词
 */
function buildAnalysisInsightPrompt(options: InsightGenerationOptions): string {
  return `
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

请分析以下日记内容：

日记标题：${options.title}
日记内容：${options.content}
用户情绪标签：${options.emotion || '未指定'}

请返回JSON格式的分析结果。`
}

/**
 * 生成备用洞察模板
 */
function generateFallbackInsight(options: InsightGenerationOptions): string {
  // 使用通用的备用模板，不再区分类型
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
