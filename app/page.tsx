"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Home, BookOpen, Plus, BarChart3, User, ChevronLeft, ChevronRight, LogOut, Edit3, Mail, X } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { formatDate, getEmotionColor, getEmotionEmoji, getCurrentDateInfo, getGreeting } from "@/lib/utils"
import { getAvatarById } from "@/lib/avatar-library"

export default function HomePage() {
  const { user, logout } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date()) // 当前日期
  const [userTasks, setUserTasks] = useState<any[]>([])
  const [userDiaries, setUserDiaries] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)

  // 版本更新数据
  const versionUpdates = [
    {
      version: "V1.1",
      date: "2024年8月27日",
      title: "🎉 小愈的第一次成长",
      updates: [
        "🤖 AI情绪洞察分析正式上线啦！小愈现在不仅能陪你聊天，还能帮你分析情绪变化，是不是很贴心？",
        "💭 生成日记前增加了温馨提醒，避免误触，让每一次记录都更有意义～",
        "✨ 修复了一些小bug，优化了用户体验，让小愈变得更加聪明可爱！"
      ]
    },
    {
      version: "V1.0",
      date: "2024年8月20日",
      title: "🌟 iCare心语迹正式上线",
      updates: [
        "🎊 小愈诞生啦！你的专属AI心灵伙伴正式上线",
        "📝 支持AI对话生成日记，让记录心情变得简单有趣",
        "📊 情绪分析功能，帮你更好地了解自己的内心世界",
        "🎨 温暖治愈的界面设计，给你最舒适的体验"
      ]
    }
  ]

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
      // 加载用户资料
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("username, birthday, writing_style, diary_length, avatar_id")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Error loading user profile:", profileError)
      } else {
        setUserProfile(profile)
        console.log("Loaded user profile:", profile)
      }

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

      days.push(
        <div
          key={day}
          className={`w-8 h-8 flex items-center justify-center text-sm rounded-full gentle-transition hover:scale-110 cursor-pointer ${
            hasEmotion ? "text-white font-medium" : "text-muted-foreground"
          }`}
          style={{
            backgroundColor: hasEmotion ? "#9F7AEA" : "transparent"
          }}
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
            {/* 通知图标 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative gentle-transition" 
              onClick={() => setShowNotifications(true)}
            >
              <Mail className="w-5 h-5" />
              {/* 小红点提示 */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-300 rounded-full"></div>
            </Button>
            
            <Button variant="ghost" size="icon" className="gentle-transition" onClick={logout}>
              <LogOut className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src={userProfile?.avatar_id ? getAvatarById(userProfile.avatar_id)?.url : "/placeholder.svg?height=32&width=32"} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {(userProfile?.username || user?.username)?.charAt(0)?.toUpperCase() || "用户"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="px-4 pb-20">
          {/* 问候语 */}
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
              {getGreeting()}，{userProfile?.username || user?.username || "朋友"}
            </h2>
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
                  {userDiaries.length}条
                </Badge>
              </div>
            </div>
          </div>

          {/* 操作按钮区域 */}
          <div className="space-y-3 mb-6 grid grid-cols-2 gap-4">
            {/* 开始新对话按钮 */}
            <Link href="/chat">
              <Button className="w-full h-12 bg-[#9F7AEA] hover:bg-[#8B5CF6] text-white font-medium rounded-2xl soft-shadow gentle-transition hover:scale-[1.02]">
                <Plus className="w-5 h-5 mr-2" />
                和我对话
              </Button>
            </Link>
            
            {/* 手动记录日记按钮 */}
            <Link href="/diary/new">
              <Button variant="outline" className="w-full h-12 border-primary text-primary hover:bg-primary/5 font-medium rounded-2xl soft-shadow gentle-transition hover:scale-[1.02]">
                <Edit3 className="w-5 h-5 mr-2" />
                手动记录
              </Button>
            </Link>
          </div>

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

            {/* 图例说明 */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#9F7AEA" }}></div>
              <span className="text-xs text-muted-foreground">有记录的日期</span>
            </div>
            
            {/* 本月记录统计 */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">本月记录: {userDiaries.length} 条</div>
              <div className="text-xs text-muted-foreground">
                最近记录: {userDiaries.length > 0 ? new Date(userDiaries[0]?.created_at).toLocaleDateString("zh-CN") : "暂无"}
              </div>
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

        {/* 版本更新通知弹窗 */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card/95 border border-border/50 rounded-2xl p-6 max-w-md mx-4 max-h-[80vh] overflow-y-auto soft-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-serif font-semibold text-lg text-foreground">版本更新</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowNotifications(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {versionUpdates.map((version, index) => (
                  <div key={version.version} className="border-l-4 border-primary/30 pl-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="border-primary text-primary text-xs">
                        {version.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{version.date}</span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-3">{version.title}</h4>
                    <ul className="space-y-2">
                      {version.updates.map((update, updateIndex) => (
                        <li key={updateIndex} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{update}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-border/50">
                <p className="text-xs text-center text-muted-foreground">
                  💝 感谢你的陪伴，小愈会继续努力成长，为你带来更好的体验！
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
