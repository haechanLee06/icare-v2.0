import { supabase } from '@/lib/supabase/client'

export interface EmotionAnalysisResult {
  mood_score: number
  emotion_keywords: string[]
  event_keywords: string[]
}

/**
 * 使用AI分析日记内容的情绪
 * @param title 日记标题
 * @param content 日记内容
 * @param emotion 用户选择的情绪标签
 * @returns 情绪分析结果
 */
export async function analyzeEmotionWithAI(
  title: string,
  content: string,
  emotion: string
): Promise<EmotionAnalysisResult | null> {
  try {
    // 构建AI分析提示词
    const prompt = `
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
    * 这些词应该聚焦于“感受”，例如“开心”、“崩溃”、“燃起来”、“心如刀割”、“松了一口气”等。
    * 结果必须是一个 JSON 字符串数组。

3.  **事件关键词 (event_keywords)**:
    * 从文本中提取引发上述情绪的客观“事件”、“原因”或“对象”。
    * 这些词应该聚焦于“事实”，即“发生了什么事”，例如“收到录取通知书”、“项目搞砸了”、“和朋友吵架”、“考试通过”等。
    * 结果必须是一个 JSON 字符串数组。

4.  **输出格式**:
    * 你必须且只能输出一个严格的、不包含任何额外解释说明的 JSON 对象。
    * JSON 对象的键必须使用英文："mood_score", "emotion_keywords", "event_keywords"。

# 示例

## 示例 1
- **输入**: 啊啊啊我成功了！收到录取通知的那一刻，我直接跳了起来！感觉这么多年的努力在这一刻全部都值了！简直是人生巅峰！现在开心到语无伦次，感觉整个人都“燃”起来了，浑身都是用不完的劲儿！这种感觉真的太爽了！
- **输出**:以JSON格式
{
  "mood_score": 10,
  "emotion_keywords": [
    "成功了",
    "值了",
    "人生巅峰",
    "开心到语无伦次",
    "燃起来",
    "太爽了"
  ],
  "event_keywords": [
    "收到录取通知",
    "多年的努力"
  ]
}`

    // 调用AI接口进行分析
    const response = await fetch('/api/ai/analyze-emotion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        title,
        content,
        emotion
      })
    })

    if (!response.ok) {
      throw new Error(`AI分析请求失败: ${response.status}`)
    }

    const result = await response.json()
    
    // 验证返回的数据格式
    if (!result.mood_score || !result.emotion_keywords || !result.event_keywords) {
      throw new Error('AI返回的数据格式不正确')
    }

    // 确保mood_score在1-10范围内
    const moodScore = Math.max(1, Math.min(10, Math.round(result.mood_score)))
    
    // 确保关键词数组长度正确
    const emotionKeywords = Array.isArray(result.emotion_keywords) 
      ? result.emotion_keywords.slice(0, 6) 
      : []
    const eventKeywords = Array.isArray(result.event_keywords) 
      ? result.event_keywords.slice(0, 2) 
      : []

    return {
      mood_score: moodScore,
      emotion_keywords: emotionKeywords,
      event_keywords: eventKeywords
    }

  } catch (error) {
    console.error('AI情绪分析失败:', error)
    return null
  }
}

/**
 * 保存情绪分析结果到数据库
 * @param diaryId 日记ID
 * @param userId 用户ID
 * @param analysisResult 分析结果
 * @returns 是否保存成功
 */
export async function saveEmotionAnalysis(
  diaryId: number,
  userId: number,
  analysisResult: EmotionAnalysisResult
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('diary_entries')
      .update({
        mood_score: analysisResult.mood_score,
        emotion_keywords: analysisResult.emotion_keywords,
        event_keywords: analysisResult.event_keywords,
        ai_analysis_updated_at: new Date().toISOString()
      })
      .eq('id', diaryId)
      .eq('user_id', userId)

    if (error) {
      console.error('保存情绪分析结果失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('保存情绪分析结果异常:', error)
    return false
  }
}
