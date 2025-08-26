import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日期处理工具函数
export function formatDate(date: Date, format: 'full' | 'short' | 'month-day' | 'time' = 'full'): string {
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString()
  
  switch (format) {
    case 'full':
      if (isToday) {
        return `今天 · ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
      } else if (isYesterday) {
        return `昨天 · ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
      } else {
        return date.toLocaleDateString('zh-CN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        })
      }
    case 'short':
      if (isToday) {
        return '今天'
      } else if (isYesterday) {
        return '昨天'
      } else {
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      }
    case 'month-day':
      return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
    case 'time':
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    default:
      return date.toLocaleDateString('zh-CN')
  }
}

export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}分钟前`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}小时前`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}天前`
  } else {
    return formatDate(date, 'short')
  }
}

export function getCurrentDateInfo() {
  const now = new Date()
  return {
    fullDate: formatDate(now, 'full'),
    monthDay: formatDate(now, 'month-day'),
    time: formatDate(now, 'time'),
    timestamp: now.getTime(),
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    weekday: now.getDay(),
    weekdayName: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
  }
}

// 情绪标签工具函数
export function getEmotionColor(emotion: string): string {
  const emotionColors: Record<string, string> = {
    '开心': 'bg-green-100 text-green-800',
    '平静': 'bg-blue-100 text-blue-800',
    '感动': 'bg-pink-100 text-pink-800',
    '期待': 'bg-yellow-100 text-yellow-800',
    '释然': 'bg-purple-100 text-purple-800',
    '自豪': 'bg-orange-100 text-orange-800',
    '温暖': 'bg-red-100 text-red-800',
    '充实': 'bg-indigo-100 text-indigo-800',
    '感恩': 'bg-teal-100 text-teal-800',
    '希望': 'bg-emerald-100 text-emerald-800',
    '难过': 'bg-gray-100 text-gray-800',
    '焦虑': 'bg-yellow-100 text-yellow-800',
    '愤怒': 'bg-red-100 text-red-800',
    '困惑': 'bg-gray-100 text-gray-800',
    '疲惫': 'bg-gray-100 text-gray-800',
    '孤独': 'bg-gray-100 text-gray-800',
    '压力': 'bg-gray-100 text-gray-800',
    '羞愧': 'bg-gray-100 text-gray-800',
    '惊喜': 'bg-yellow-100 text-yellow-800'
  }
  
  return emotionColors[emotion] || 'bg-gray-100 text-gray-800'
}

export function getEmotionEmoji(emotion: string): string {
  const emotionEmojis: Record<string, string> = {
    '开心': '😊',
    '平静': '😌',
    '感动': '🥰',
    '期待': '🤗',
    '释然': '😌',
    '自豪': '😎',
    '温暖': '🤗',
    '充实': '😊',
    '感恩': '🙏',
    '希望': '✨',
    '难过': '😢',
    '焦虑': '😰',
    '愤怒': '😠',
    '困惑': '🤔',
    '疲惫': '😴',
    '孤独': '😔',
    '压力': '😤',
    '羞愧': '😳',
    '惊喜': '😲'
  }
  
  return emotionEmojis[emotion] || '😊'
}

/**
 * 根据当前时间生成问候语
 * @returns 问候语字符串
 */
export function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return "早上好"
  } else if (hour >= 12 && hour < 14) {
    return "中午好"
  } else if (hour >= 14 && hour < 18) {
    return "下午好"
  } else if (hour >= 18 && hour < 22) {
    return "晚上好"
  } else {
    return "夜深了"
  }
}

/**
 * 清理AI返回的JSON响应，移除可能的markdown格式标记
 * @param aiResponse AI返回的原始响应
 * @returns 清理后的响应字符串
 */
export function cleanAIResponse(aiResponse: string): string {
  let cleanResponse = aiResponse.trim()
  
  // 如果响应被markdown代码块包围，提取其中的内容
  if (cleanResponse.startsWith('```json') && cleanResponse.endsWith('```')) {
    cleanResponse = cleanResponse.slice(7, -3).trim()
  } else if (cleanResponse.startsWith('```') && cleanResponse.endsWith('```')) {
    cleanResponse = cleanResponse.slice(3, -3).trim()
  }
  
  return cleanResponse
}
