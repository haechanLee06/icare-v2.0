import { supabase } from "@/lib/supabase/client"

export interface EmotionData {
  date: string
  mood_score: number
  title: string
  emotion_keywords: string[]
  event_keywords: string[]
}

export interface EmotionStats {
  averageMood: number
  moodTrend: "up" | "down" | "stable"
  totalRecords: number
  moodDistribution: {
    score: number
    count: number
    percentage: number
  }[]
}

/**
 * 获取指定时间范围内的情绪分析数据
 */
export async function getEmotionData(
  userId: number, 
  days: number
): Promise<EmotionData[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('diary_entries')
      .select('id, title, mood_score, emotion_keywords, event_keywords, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', new Date().toISOString())
      .not('mood_score', 'is', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error("Error loading emotion data:", error)
      return []
    }

    return processEmotionData(data || [])
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

/**
 * 获取情绪统计数据
 */
export async function getEmotionStats(
  userId: number, 
  days: number
): Promise<EmotionStats> {
  try {
    const emotionData = await getEmotionData(userId, days)
    
    if (emotionData.length === 0) {
      return {
        averageMood: 0,
        moodTrend: "stable",
        totalRecords: 0,
        moodDistribution: []
      }
    }

    // 计算平均情绪分数
    const totalScore = emotionData.reduce((sum, item) => sum + item.mood_score, 0)
    const averageMood = Math.round(totalScore / emotionData.length * 10) / 10

    // 计算情绪趋势
    let moodTrend: "up" | "down" | "stable" = "stable"
    if (emotionData.length >= 2) {
      const firstScore = emotionData[0].mood_score
      const lastScore = emotionData[emotionData.length - 1].mood_score
      if (lastScore > firstScore + 1) moodTrend = "up"
      else if (lastScore < firstScore - 1) moodTrend = "down"
    }

    // 计算情绪分布
    const moodCounts = emotionData.reduce((acc, item) => {
      const score = Math.floor(item.mood_score)
      acc[score] = (acc[score] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const moodDistribution = Object.entries(moodCounts).map(([score, count]) => ({
      score: parseInt(score),
      count,
      percentage: Math.round((count / emotionData.length) * 100)
    })).sort((a, b) => a.score - b.score)

    return {
      averageMood,
      moodTrend,
      totalRecords: emotionData.length,
      moodDistribution
    }
  } catch (error) {
    console.error("Error getting emotion stats:", error)
    return {
      averageMood: 0,
      moodTrend: "stable",
      totalRecords: 0,
      moodDistribution: []
    }
  }
}

/**
 * 处理情绪数据，按日期分组并计算平均值
 */
function processEmotionData(data: any[]): EmotionData[] {
  // 按日期分组，如果同一天有多条记录，取平均值
  const groupedByDate = data.reduce((acc, item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = {
        scores: [],
        titles: [],
        emotionKeywords: [],
        eventKeywords: []
      }
    }
    acc[date].scores.push(item.mood_score)
    acc[date].titles.push(item.title)
    acc[date].emotionKeywords.push(...(item.emotion_keywords || []))
    acc[date].eventKeywords.push(...(item.event_keywords || []))
    return acc
  }, {})

  // 转换为最终格式
  return Object.entries(groupedByDate).map(([date, data]: [string, any]) => ({
    date,
    mood_score: Math.round(data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length * 10) / 10,
    title: data.titles[0], // 取第一条记录的标题
    emotion_keywords: [...new Set(data.emotionKeywords)].slice(0, 5) as string[], // 去重并限制数量
    event_keywords: [...new Set(data.eventKeywords)].slice(0, 3) as string[]
  }))
}

/**
 * 获取情绪颜色
 */
export function getMoodColor(score: number): string {
  if (score >= 8) return "text-green-600"
  if (score >= 6) return "text-blue-600"
  if (score >= 4) return "text-yellow-600"
  return "text-red-600"
}

/**
 * 获取情绪表情
 */
export function getMoodEmoji(score: number): string {
  if (score >= 8) return "😊"
  if (score >= 6) return "😌"
  if (score >= 4) return "😐"
  return "😔"
}

/**
 * 获取趋势图标类型
 */
export function getTrendIcon(trend: "up" | "down" | "stable"): string {
  switch (trend) {
    case "up":
      return "trending-up"
    case "down":
      return "trending-down"
    default:
      return "minus"
  }
}

/**
 * 获取趋势文本
 */
export function getTrendText(trend: "up" | "down" | "stable"): string {
  switch (trend) {
    case "up":
      return "情绪上升"
    case "down":
      return "情绪下降"
    default:
      return "情绪稳定"
  }
}
