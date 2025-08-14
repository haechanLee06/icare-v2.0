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
  Edit,
  MoreHorizontal,
  Share2,
  Home,
  BookOpen,
  Plus,
  BarChart3,
  User,
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

interface DiaryEntry {
  id: string
  title: string
  content: string
  date: string
  time: string
  emotion: string
  emotionColor: string
}

export default function DiaryPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2023, 7)) // 2023年8月

  const diaryEntries: DiaryEntry[] = [
    {
      id: "1",
      title: "平静的午后",
      content:
        "今天的阳光格外温暖，还过同市雨在车里看上，便感到我接触了一个小小的温暖风景。我接着一杯茶水，轻嗅一口，便感觉温暖人心的小确幸延续到全身。",
      date: "2023年8月13日",
      time: "星期日 · 15:30",
      emotion: "平静",
      emotionColor: "bg-blue-100 text-blue-800",
    },
    {
      id: "2",
      title: "雨外的清新",
      content: "今天下了一整天的雨，空气中弥漫着清新的味道。我喜欢这样的天气，让人感到宁静和放松。",
      date: "2023年8月12日",
      time: "星期六 · 20:15",
      emotion: "愉悦",
      emotionColor: "bg-green-100 text-green-800",
    },
    {
      id: "3",
      title: "忙碌的一天",
      content: "工作很忙，但是完成了很多事情。虽然累，但是很有成就感。",
      date: "2023年8月10日",
      time: "星期四 · 22:30",
      emotion: "充实",
      emotionColor: "bg-orange-100 text-orange-800",
    },
  ]

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
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-medium text-foreground">{formatMonth(currentDate)}</h2>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-4 pb-20">
          <p className="text-center text-sm text-muted-foreground mb-6">共13篇日记</p>

          {/* 今日特别日记 */}
          <Card className="p-4 mb-6 soft-shadow gentle-transition hover:shadow-lg border-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <Badge className={diaryEntries[0].emotionColor}>{diaryEntries[0].emotion}</Badge>
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
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{diaryEntries[0].content}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{diaryEntries[0].time}</p>
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

          {/* AI情绪洞察 */}
          <Card className="p-4 mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">🦊</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">AI情绪洞察</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  基于今天的对话内容和情绪，你一种平静的心境正在形成。从你的描述中，我感受到你对生活中小确幸的珍视，这是一种很棒的生活态度。
                </p>
                <p className="text-xs text-muted-foreground mt-2">基于今日对话生成</p>
              </div>
            </div>
          </Card>

          {/* 更多日记 */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-foreground">更多日记</h3>

            {diaryEntries.slice(1).map((entry) => (
              <Link key={entry.id} href={`/diary/${entry.id}`}>
                <Card className="p-4 soft-shadow gentle-transition hover:shadow-lg cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground">{entry.title}</h4>
                    <Badge variant="outline" className={entry.emotionColor}>
                      {entry.emotion}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">{entry.content}</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </Card>
              </Link>
            ))}
          </div>

          {/* 查看全部日记按钮 */}
          <div className="mt-6 text-center">
            <Button variant="outline" className="gentle-transition hover:bg-primary/5 bg-transparent">
              查看全部日记
            </Button>
          </div>
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
