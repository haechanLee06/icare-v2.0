"use client"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Share2, Heart, MoreHorizontal, ChevronLeft, ChevronRight, Edit, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { formatDate, getEmotionColor, getEmotionEmoji, getCurrentDateInfo } from "@/lib/utils"

interface DiaryEntry {
  id: string
  title: string
  content: string
  emotion: string
  ai_insight?: string
  created_at: string
  updated_at: string
  mood_tags?: string[]
  weather?: string
  location?: string
}

export default function DiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [diaryEntry, setDiaryEntry] = useState<DiaryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentDate = getCurrentDateInfo()

  useEffect(() => {
    async function fetchDiaryEntry() {
      try {
        setLoading(true)
        
        // 获取当前用户信息
        const userStr = localStorage.getItem("user")
        if (!userStr) {
          setError("用户未登录")
          return
        }
        
        const user = JSON.parse(userStr)
        
        const { data, error } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)  // 添加用户ID过滤，确保用户只能访问自己的日记
          .single()

        if (error) {
          throw error
        }

        setDiaryEntry(data)
      } catch (err) {
        console.error('Error fetching diary entry:', err)
        setError(err instanceof Error ? err.message : '加载日记失败')
      } finally {
        setLoading(false)
      }
    }

    fetchDiaryEntry()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  if (error || !diaryEntry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || '日记不存在'}</p>
          <Link href="/diary">
            <Button>返回日记列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  const createdDate = new Date(diaryEntry.created_at)
  const emotionColor = getEmotionColor(diaryEntry.emotion)
  const emotionEmoji = getEmotionEmoji(diaryEntry.emotion)

  return (
    <div className="min-h-screen bg-background paper-texture">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between p-4 pt-12">
        <Link href="/diary">
          <Button variant="ghost" size="icon" className="gentle-transition">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="gentle-transition">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </header>

      <div className="px-4 pb-20">
        {/* 日记标题和信息 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{currentDate.monthDay}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <h1 className="text-xl font-serif font-bold text-foreground">{diaryEntry.title}</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(createdDate, 'full')}
              </p>
            </div>
            <Link href={`/diary/${diaryEntry.id}/edit`}>
              <Button variant="ghost" size="icon" className="gentle-transition">
                <Edit className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={emotionColor}>
              {emotionEmoji} {diaryEntry.emotion}
            </Badge>
            {diaryEntry.weather && (
              <Badge variant="outline" className="text-xs">
                🌤️ {diaryEntry.weather}
              </Badge>
            )}
            {diaryEntry.location && (
              <Badge variant="outline" className="text-xs">
                📍 {diaryEntry.location}
              </Badge>
            )}
          </div>
        </div>

        {/* 日记内容 */}
        <Card className="p-6 mb-6 soft-shadow">
          <div className="prose prose-sm max-w-none">
            {diaryEntry.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="text-foreground leading-relaxed mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>

          {/* 互动按钮 */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground gentle-transition hover:text-primary">
                <Heart className="w-4 h-4 mr-1" />
                收藏
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground gentle-transition hover:text-primary">
                <Share2 className="w-4 h-4 mr-1" />
                分享
              </Button>
            </div>
          </div>
        </Card>

        {/* AI情绪洞察 */}
        {diaryEntry.ai_insight && (
          <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">🦊</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-2">AI情绪洞察</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{diaryEntry.ai_insight}</p>

                {diaryEntry.mood_tags && diaryEntry.mood_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {diaryEntry.mood_tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">{formatDate(createdDate, 'short')}生成</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
