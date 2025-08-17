"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, TrendingDown, Minus, BarChart3, Activity, Target, Home, BookOpen, Plus, User } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { 
  getEmotionData, 
  getEmotionStats, 
  getMoodColor, 
  getMoodEmoji, 
  type EmotionData 
} from "@/lib/emotion-analysis"

interface TimeRange {
  label: string
  days: number
  value: string
}

export default function InsightsPage() {
  const { user } = useAuth()
  const [emotionData, setEmotionData] = useState<EmotionData[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("7")
  const [isLoading, setIsLoading] = useState(true)
  const [averageMood, setAverageMood] = useState(0)
  const [moodTrend, setMoodTrend] = useState<"up" | "down" | "stable">("stable")

  const timeRanges: TimeRange[] = [
    { label: "1天", days: 1, value: "1" },
    { label: "7天", days: 7, value: "7" },
    { label: "14天", days: 14, value: "14" },
    { label: "30天", days: 30, value: "30" },
    { label: "90天", days: 90, value: "90" }
  ]

  useEffect(() => {
    if (user) {
      loadEmotionData()
    }
  }, [user, selectedTimeRange])

  const loadEmotionData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      const days = parseInt(selectedTimeRange)
      
      // 使用新的函数获取情绪数据和统计
      const [emotionDataResult, emotionStats] = await Promise.all([
        getEmotionData(user.id, days),
        getEmotionStats(user.id, days)
      ])
      
      setEmotionData(emotionDataResult)
      setAverageMood(emotionStats.averageMood)
      setMoodTrend(emotionStats.moodTrend)

    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background paper-texture flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载情绪分析数据中...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background paper-texture">
        {/* 顶部导航 */}
        <header className="flex items-center justify-between p-4 pt-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <h1 className="text-xl font-serif font-bold text-primary">情绪分析</h1>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">智能洞察</span>
          </div>
        </header>

        <main className="px-4 pb-24">
          {/* 时间范围选择器 */}
          <Card className="p-4 mb-6 soft-shadow bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">选择时间范围</h2>
              <div className="flex gap-2">
                {timeRanges.map((range) => (
                  <Button
                    key={range.value}
                    variant={selectedTimeRange === range.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range.value)}
                    className="gentle-transition"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* 情绪概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 soft-shadow bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Target className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">平均情绪分数</p>
                  <p className={`text-2xl font-bold ${getMoodColor(averageMood)}`}>
                    {averageMood.toFixed(1)}/10
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 soft-shadow bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-200 rounded-lg">
                  <Activity className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">情绪趋势</p>
                  <div className="flex items-center gap-2">
                    {moodTrend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : moodTrend === "down" ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <Minus className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-lg font-semibold text-foreground">
                      {moodTrend === "up" ? "情绪上升" : moodTrend === "down" ? "情绪下降" : "情绪稳定"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 soft-shadow bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-200 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">记录数量</p>
                  <p className="text-2xl font-bold text-foreground">
                    {emotionData.length} 条
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* 情绪评分折线图 */}
          <Card className="p-6 soft-shadow mb-6 bg-white/80 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-foreground mb-6">情绪评分趋势</h2>
            
            {emotionData.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无情绪数据</p>
                <p className="text-sm text-muted-foreground">开始记录日记来查看情绪分析</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 美化的折线图 */}
                <div className="relative h-80 bg-gradient-to-b from-blue-50 via-white to-purple-50 rounded-xl p-6 border border-blue-100">
                  {/* Y轴标签 */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground font-medium">
                    <span className="text-green-600">10</span>
                    <span className="text-blue-600">8</span>
                    <span className="text-yellow-600">6</span>
                    <span className="text-orange-600">4</span>
                    <span className="text-red-600">2</span>
                  </div>
                  
                  {/* 网格线 */}
                  <div className="absolute left-8 top-0 h-full w-full">
                    {[0, 25, 50, 75, 100].map((percent) => (
                      <div
                        key={percent}
                        className="absolute w-full border-t border-gray-200"
                        style={{ top: `${percent}%` }}
                      />
                    ))}
                  </div>
                  
                  {/* 折线图 */}
                  <div className="relative h-full ml-12">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* 渐变背景区域 */}
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                      
                      {/* 填充区域 */}
                      <path
                        fill="url(#areaGradient)"
                        d={`M 0,${100 - (emotionData[0]?.mood_score || 5) / 10 * 100} ${emotionData.map((item, index) => {
                          const x = (index / (emotionData.length - 1)) * 100
                          const y = 100 - (item.mood_score / 10) * 100
                          return `L ${x},${y}`
                        }).join(" ")} L 100,${100 - (emotionData[emotionData.length - 1]?.mood_score || 5) / 10 * 100} L 100,100 L 0,100 Z`}
                      />
                      
                      {/* 折线 */}
                      <polyline
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={emotionData.map((item, index) => {
                          const x = (index / (emotionData.length - 1)) * 100
                          const y = 100 - (item.mood_score / 10) * 100
                          return `${x},${y}`
                        }).join(" ")}
                      />
                    </svg>
                    
                    {/* 数据点 */}
                    {emotionData.map((item, index) => {
                      const x = (index / (emotionData.length - 1)) * 100
                      const y = 100 - (item.mood_score / 10) * 100
                      return (
                        <div
                          key={item.date}
                          className="absolute w-4 h-4 bg-white rounded-full border-3 border-primary shadow-lg cursor-pointer hover:scale-125 transition-transform duration-200"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          title={`${item.date}: ${item.mood_score}/10 - ${item.title}`}
                        />
                      )
                    })}
                  </div>
                  
                  {/* X轴标签 */}
                  <div className="flex justify-between mt-6 ml-12 text-xs text-muted-foreground font-medium">
                    {emotionData.map((item, index) => (
                      <span key={item.date} className="text-center">
                        {new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 数据详情 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {emotionData.map((item) => (
                    <div key={item.date} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">
                          {new Date(item.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                        </span>
                        <span className={`text-lg font-bold ${getMoodColor(item.mood_score)}`}>
                          {getMoodEmoji(item.mood_score)} {item.mood_score}/10
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground mb-3 line-clamp-2 font-medium">{item.title}</p>
                      
                      {/* 情绪关键词 */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.emotion_keywords.slice(0, 3).map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* 事件关键词 */}
                      <div className="flex flex-wrap gap-1">
                        {item.event_keywords.slice(0, 2).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-purple-200 text-purple-700">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </main>

        {/* 底部导航 */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: Home, label: "首页", active: false, href: "/" },
              { icon: BookOpen, label: "日记", active: false, href: "/diary" },
              { icon: Plus, label: "", active: false, isCenter: true, href: "/chat" },
              { icon: BarChart3, label: "分析", active: true, href: "/insights" },
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
