"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Home, BookOpen, Plus, BarChart3, User, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

export default function HomePage() {
  const { user, logout } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date()) // 当前日期
  const [userTasks, setUserTasks] = useState<any[]>([])
  const [userDiaries, setUserDiaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("HomePage useEffect - user:", user)
    if (user) {
      loadUserData()
    } else {
      console.log("No user found, setting loading to false")
      setLoading(false)
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    console.log("Loading user data for user:", user.id)
    
    try {
      // Load user tasks
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (tasksError) {
        console.error("Error loading tasks:", tasksError)
      }

      // Load user diary entries for calendar (get more data for current month)
      const currentMonth = new Date()
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      const { data: diaries, error: diariesError } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString())
        .order("created_at", { ascending: false })

      if (diariesError) {
        console.error("Error loading diaries:", diariesError)
      }

      console.log("Loaded tasks:", tasks)
      console.log("Loaded diaries for calendar:", diaries)

      setUserTasks(tasks || [])
      setUserDiaries(diaries || [])
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const emotions = [
    { name: "平静", color: "bg-secondary", count: 1 },
    { name: "快乐", color: "bg-accent", count: 2 },
    { name: "优雅", color: "bg-primary", count: 3 },
    { name: "光辉", color: "bg-yellow-200", count: 4 },
    { name: "兴奋", color: "bg-orange-200", count: 5 },
  ]

  const insights = userDiaries.slice(0, 2).map((diary: any) => ({
    content: diary.ai_insight || `你在${new Date(diary.created_at).toLocaleDateString()}记录了美好的心情`,
    date: new Date(diary.created_at).toLocaleDateString("zh-CN", { month: "long", day: "numeric" }),
  }))

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  // 获取指定日期的情绪颜色
  const getEmotionColorForDay = (day: number) => {
    const diaryForDay = userDiaries.find((diary: any) => {
      const diaryDate = new Date(diary.created_at)
      return diaryDate.getDate() === day
    })
    
    if (!diaryForDay) return ""
    
    // 根据日记的情绪或内容选择颜色
    const emotion = diaryForDay.emotion || diaryForDay.content || ""
    if (emotion.includes("快乐") || emotion.includes("开心") || emotion.includes("兴奋")) {
      return emotions[1].color // 快乐 - 黄色
    } else if (emotion.includes("平静") || emotion.includes("安静") || emotion.includes("放松")) {
      return emotions[0].color // 平静 - 灰色
    } else if (emotion.includes("优雅") || emotion.includes("美好") || emotion.includes("温暖")) {
      return emotions[2].color // 优雅 - 紫色
    } else if (emotion.includes("光辉") || emotion.includes("明亮") || emotion.includes("希望")) {
      return emotions[3].color // 光辉 - 黄色
    } else {
      return emotions[4].color // 默认 - 橙色
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // 空白天数
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }

    // 实际天数
    for (let day = 1; day <= daysInMonth; day++) {
      // 根据真实数据判断这一天是否有情绪记录
      const hasEmotion = userDiaries.some((diary: any) => {
        const diaryDate = new Date(diary.created_at)
        return diaryDate.getDate() === day
      })
      
      // 获取情绪颜色
      const emotionColor = hasEmotion ? getEmotionColorForDay(day) : ""

      days.push(
        <div
          key={day}
          className={`w-8 h-8 flex items-center justify-center text-sm rounded-full gentle-transition hover:scale-110 cursor-pointer ${
            hasEmotion ? `${emotionColor} text-white font-medium` : "text-muted-foreground"
          }`}
          onClick={() => {
            const diaryForDay = userDiaries.find((diary: any) => {
              const diaryDate = new Date(diary.created_at)
              return diaryDate.getDate() === day
            })
            if (diaryForDay) {
              console.log(`点击了${day}号，日记内容:`, diaryForDay.content)
              // 这里可以添加跳转到日记详情页的逻辑
            }
          }}
          title={(() => {
            const diaryForDay = userDiaries.find((diary: any) => {
              const diaryDate = new Date(diary.created_at)
              return diaryDate.getDate() === day
            })
            return diaryForDay ? `点击查看${day}号的记录` : `${day}号暂无记录`
          })()}
        >
          {day}
        </div>,
      )
    }

    return days
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background paper-texture">
        {/* 顶部导航 */}
        <header className="flex items-center justify-between p-4 pt-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <h1 className="text-xl font-serif font-bold text-primary">心语迹</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="gentle-transition" onClick={logout}>
              <LogOut className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {user?.username?.charAt(0)?.toUpperCase() || "用"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="px-4 pb-20">
          {/* 问候语 */}
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">你好，{user?.username || "朋友"}</h2>
            <p className="text-muted-foreground">今天想和我聊聊什么呢？</p>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">今日心情</span>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {userDiaries.some((diary: any) => {
                    const today = new Date()
                    const diaryDate = new Date(diary.created_at)
                    return today.toDateString() === diaryDate.toDateString()
                  }) ? "已记录" : "待记录"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">本月记录</span>
                <Badge variant="outline" className="border-primary text-primary">
                  {userDiaries.length}天
                </Badge>
              </div>
            </div>
          </div>

          {/* 开始新对话按钮 */}
          <Link href="/chat">
            <Button className="w-full mb-6 h-12 bg-[#9F7AEA] hover:bg-[#8B5CF6] text-white font-medium rounded-2xl soft-shadow gentle-transition hover:scale-[1.02]">
              <Plus className="w-5 h-5 mr-2" />
              开始新对话
            </Button>
          </Link>

          {/* 情绪日历 */}
          <Card className="p-4 mb-6 soft-shadow gentle-transition hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-foreground">情绪日历</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">
                  {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
                </span>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                <div key={day} className="text-center text-xs text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* 日历网格 */}
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

            {/* 情绪图例 */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              {emotions.map((emotion, index) => (
                <div key={emotion.name} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${emotion.color}`}></div>
                  <span className="text-xs text-muted-foreground">{emotion.name}</span>
                </div>
              ))}
            </div>
            
            {/* 本月情绪统计 */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">本月记录: {userDiaries.length} 天</div>
              <div className="text-xs text-muted-foreground">
                最近记录: {userDiaries.length > 0 ? new Date(userDiaries[0]?.created_at).toLocaleDateString("zh-CN") : "暂无"}
              </div>
            </div>
          </Card>

          {/* 近期洞察 */}
          <Card className="p-4 soft-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-foreground">近期洞察</h3>
              <Link href="/insights">
                <Button variant="ghost" className="text-primary text-sm p-0 h-auto">
                  查看全部洞察
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-xl gentle-transition hover:bg-muted/70">
                    <p className="text-sm text-foreground leading-relaxed mb-2">"{insight.content}"</p>
                    <p className="text-xs text-muted-foreground">{insight.date}</p>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">开始你的第一次对话，获得AI洞察吧！</p>
                </div>
              )}
            </div>
          </Card>
        </main>

        {/* 底部导航 */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: Home, label: "首页", active: true, href: "/" },
              { icon: BookOpen, label: "日记", active: false, href: "/diary" },
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
