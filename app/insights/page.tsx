"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  MoreHorizontal,
  Home,
  BookOpen,
  Plus,
  BarChart3,
  User,
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState("情绪概览")
  const [currentDate, setCurrentDate] = useState(new Date(2023, 7)) // 2023年8月

  const emotionData = [
    { name: "平静", percentage: 42, color: "bg-pink-300", count: 12 },
    { name: "快乐", percentage: 28, color: "bg-blue-300", count: 8 },
    { name: "优雅", percentage: 18, color: "bg-purple-300", count: 5 },
    { name: "光辉", percentage: 12, color: "bg-yellow-300", count: 3 },
  ]

  const recentDiaries = [
    {
      id: "1",
      title: "平静的午后",
      date: "8月13日",
      time: "15:30",
      preview: "今天的阳光格外温暖，还过同市雨在车里看上，便感到我接触了一个小小的温暖风景。内心...",
      emotion: "平静",
      emotionColor: "bg-pink-100 text-pink-800",
    },
    {
      id: "2",
      title: "雨外的清新",
      date: "8月10日",
      time: "20:15",
      preview: "感受了一种大不一样系列的情绪，感觉更加平静了。我觉得这种感觉很好...",
      emotion: "愉悦",
      emotionColor: "bg-blue-100 text-blue-800",
    },
  ]

  const aiInsights = [
    {
      content: "你注意到你的心情变化，内心更加平静了。大多数下午的分享都很温暖，我觉得这是一种很好的情绪状态。",
      date: "8月14日生成",
      tags: ["情绪稳定"],
    },
    {
      content:
        "你的词汇选择体现出更多的积极情绪，使用了30%，这表明你的情绪正在朝着更积极的方向发展，这是一种很好的趋势。",
      date: "8月12日生成",
      tags: ["积极向上"],
    },
  ]

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  // 计算饼图的路径
  const createPieSlice = (percentage: number, startAngle: number, color: string) => {
    const angle = (percentage / 100) * 360
    const endAngle = startAngle + angle
    const largeArcFlag = angle > 180 ? 1 : 0

    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)

    return {
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      color,
      angle: endAngle,
    }
  }

  const renderPieChart = () => {
    let currentAngle = -90 // 从顶部开始
    const slices = emotionData.map((emotion) => {
      const slice = createPieSlice(emotion.percentage, currentAngle, emotion.color)
      currentAngle = slice.angle
      return { ...slice, ...emotion }
    })

    return (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {slices.map((slice, index) => (
            <path key={index} d={slice.path} className={slice.color} />
          ))}
        </svg>
      </div>
    )
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
            <h1 className="text-xl font-serif font-bold text-foreground">情绪洞察</h1>
          </div>
          <Button variant="ghost" size="icon" className="gentle-transition">
            <Share2 className="w-5 h-5" />
          </Button>
        </header>

        <div className="px-4 pb-20">
          {/* 标签切换 */}
          <div className="flex gap-1 mb-6 bg-muted/30 rounded-lg p-1">
            {["情绪概览", "分析报告"].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`flex-1 h-10 gentle-transition ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>

          {activeTab === "情绪概览" && (
            <>
              {/* 情绪概览卡片 */}
              <Card className="p-6 mb-6 soft-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-semibold text-foreground">情绪概览</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium">{formatMonth(currentDate)}</span>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 饼图 */}
                {renderPieChart()}

                {/* 情绪统计 */}
                <div className="grid grid-cols-2 gap-3">
                  {emotionData.map((emotion) => (
                    <div key={emotion.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${emotion.color}`}></div>
                      <span className="text-sm text-foreground">{emotion.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{emotion.percentage}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 近期日记 */}
              <Card className="p-4 mb-6 soft-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-semibold text-foreground">近期日记</h3>
                  <Button variant="ghost" className="text-primary text-sm p-0 h-auto">
                    查看全部
                  </Button>
                </div>

                <div className="space-y-4">
                  {recentDiaries.map((diary) => (
                    <Link key={diary.id} href={`/diary/${diary.id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-xl gentle-transition hover:bg-muted/30 cursor-pointer">
                        <div className={`w-2 h-2 rounded-full ${diary.emotionColor.split(" ")[0]} mt-2`}></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{diary.title}</h4>
                            <Badge variant="outline" className={diary.emotionColor}>
                              {diary.emotion}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 leading-relaxed line-clamp-2">
                            {diary.preview}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {diary.date} {diary.time}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* AI洞察 */}
          <Card className="p-4 soft-shadow">
            <h3 className="font-serif font-semibold text-foreground mb-4">AI洞察</h3>

            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl"
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">🦊</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed mb-2">"{insight.content}"</p>
                    <div className="flex items-center gap-2 mb-1">
                      {insight.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 底部导航 */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
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
