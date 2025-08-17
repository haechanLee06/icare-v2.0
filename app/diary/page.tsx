"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit,
  MoreHorizontal,
  Share2,
  Home,
  BookOpen,
  Plus,
  BarChart3,
  User,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { formatDate, getEmotionColor, getEmotionEmoji, getCurrentDateInfo } from "@/lib/utils"

interface DiaryEntry {
  id: string
  title: string
  content: string
  emotion: string
  created_at: string
  updated_at: string
  ai_insight?: string
  mood_tags?: string[]
  weather?: string
  location?: string
}

export default function DiaryPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentDateInfo = getCurrentDateInfo()

  useEffect(() => {
    async function fetchDiaryEntries() {
      try {
        setLoading(true)
        
        // 使用认证上下文获取当前用户信息
        if (!user || !user.id) {
          setError("用户未登录")
          return
        }
        
        console.log("Fetching diary entries for user:", user.id, "Type:", typeof user.id)
        
        const { data, error } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('user_id', user.id)  // 确保用户ID类型匹配
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        console.log("Fetched diary entries:", data)
        setDiaryEntries(data || [])
      } catch (err) {
        console.error('Error fetching diary entries:', err)
        setError(err instanceof Error ? err.message : '加载日记失败')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDiaryEntries()
    }
  }, [user])

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background paper-texture">
        {/* 顶部导航 */}
        <header className="flex items-center justify-between p-4 pt-12">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="gentle-transition">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-serif font-bold text-foreground">我的日记</h1>
          </div>
          <Button variant="ghost" size="icon" className="gentle-transition">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </header>

        {/* 月份导航 */}
        <div className="flex items-center justify-center gap-4 px-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8"
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() - 1)
              setCurrentDate(newDate)
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-medium text-foreground">{formatMonth(currentDate)}</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8"
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() + 1)
              setCurrentDate(newDate)
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-4 pb-20">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>加载中...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>重试</Button>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground mb-6">
                共{diaryEntries.length}条记录
              </p>

          {/* 今日特别日记 */}
          {diaryEntries.length > 0 && (
            <Card className="p-4 mb-6 soft-shadow gentle-transition hover:shadow-lg border-primary/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <Badge className={getEmotionColor(diaryEntries[0].emotion)}>
                    {getEmotionEmoji(diaryEntries[0].emotion)} {diaryEntries[0].emotion}
                  </Badge>
                </div>
                <Link href={`/diary/${diaryEntries[0].id}/edit`}>
                  <Button variant="ghost" size="icon" className="w-8 h-8 gentle-transition">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <Link href={`/diary/${diaryEntries[0].id}`}>
                <div className="cursor-pointer">
                  <h3 className="font-serif font-semibold text-foreground mb-2">{diaryEntries[0].title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                    {diaryEntries[0].content}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(diaryEntries[0].created_at), 'full')}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        收藏
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7">
                        <Share2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          )}

          {/* AI情绪洞察 */}
          {diaryEntries.length > 0 && diaryEntries[0].ai_insight && (
            <Card className="p-4 mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">🦊</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">AI情绪洞察</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {diaryEntries[0].ai_insight}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    基于{formatDate(new Date(diaryEntries[0].created_at), 'short')}对话生成
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* 更多日记 */}
          {diaryEntries.length > 1 && (
            <div className="space-y-4">
              <h3 className="font-serif font-semibold text-foreground">更多日记</h3>

              {diaryEntries.slice(1).map((entry) => (
                <Link key={entry.id} href={`/diary/${entry.id}`}>
                  <Card className="p-4 soft-shadow gentle-transition hover:shadow-lg cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground">{entry.title}</h4>
                      <Badge variant="outline" className={getEmotionColor(entry.emotion)}>
                        {getEmotionEmoji(entry.emotion)} {entry.emotion}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                      {entry.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(entry.created_at), 'full')}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* 查看全部日记按钮 */}
          {/*
          <div className="mt-6 text-center">
            <Button variant="outline" className="gentle-transition hover:bg-primary/5 bg-transparent">
              查看全部日记
            </Button>
          </div>
                  */}
            </>
          )}
        </div>


        {/* 底部导航 */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: Home, label: "首页", active: false, href: "/" },
              { icon: BookOpen, label: "日记", active: true, href: "/diary" },
              { icon: Plus, label: "", active: false, isCenter: true, href: "/chat" },
              { icon: BarChart3, label: "分析", active: false, href: "/insights" },
              { icon: User, label: "我的", active: false, href: "/profile" },
            ].map((item, index) => (
              <Link key={index} href={item.href || "/"}>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-3 gentle-transition ${
                    item.isCenter
                      ? "bg-primary text-primary-foreground rounded-full w-12 h-12 p-0"
                      : item.active
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.isCenter ? "w-6 h-6" : ""}`} />
                  {!item.isCenter && <span className="text-xs">{item.label}</span>}
                </Button>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </AuthGuard>
  )
}
