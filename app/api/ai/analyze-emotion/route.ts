import { NextRequest, NextResponse } from 'next/server'
import { analyzeWithDeepSeek } from '@/lib/deepseek'
import { cleanAIResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { prompt, title, content, emotion } = await request.json()

    if (!prompt || !title || !content) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 调用DeepSeek AI进行分析
    const aiResponse = await analyzeWithDeepSeek(prompt)

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI分析失败' },
        { status: 500 }
      )
    }

    // 尝试解析AI返回的JSON
    try {
      // 清理AI返回的响应，移除可能的markdown格式标记
      const cleanResponse = cleanAIResponse(aiResponse)
      
      const analysisResult = JSON.parse(cleanResponse)
      
      // 验证数据格式
      if (!analysisResult.mood_score || !analysisResult.emotion_keywords || !analysisResult.event_keywords) {
        throw new Error('AI返回的数据格式不正确')
      }

      return NextResponse.json(analysisResult)
    } catch (parseError) {
      console.error('解析AI返回结果失败:', parseError)
      console.log('AI原始返回:', aiResponse)
      
      // 如果解析失败，返回错误
      return NextResponse.json(
        { error: 'AI返回的数据格式不正确' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('情绪分析API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
