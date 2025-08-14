"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Share2, Heart, MoreHorizontal, ChevronLeft, ChevronRight, Edit } from "lucide-react"
import Link from "next/link"

export default function DiaryDetailPage({ params }: { params: { id: string } }) {
  const diaryEntry = {
    id: params.id,
    title: "平静的午后",
    content: `今天的阳光格外温暖，还过同市雨在车里看上，便感到我接触了一个小小的温暖风景。我接着一杯茶水，轻嗅一口，便感觉温暖人心的小确幸延续到全身。

最近总是能在忙碌生活中的意义，也许来自这些小小的瞬间，像是茶香、阳光，还有内心深处的那份宁静。

今天午后的阳光透过窗户洒在桌案上，我打开了一本书，它让我想起了童年时光。那些简单而美好的记忆，像是夏日午后的蝉鸣，总是能让人感到温暖。

这些小小的幸福瞬间，构成了我们生活的底色。`,
    date: "2023年8月13日",
    time: "星期日 · 15:30",
    emotion: "平静",
    emotionColor: "bg-blue-100 text-blue-800",
  }

  const aiInsight = {
    content: `你今天的文字中透露出一种难得的宁静感，从你对阳光、茶香的细腻描述中，我感受到你正在学会从生活的细节中寻找美好。

你提到的"小确幸"概念很有意思，这说明你开始关注当下，珍惜那些看似平凡却温暖人心的瞬间。这种心境的转变，对你的情绪健康很有帮助。`,
    date: "8月13日生成",
    tags: ["内心平静", "生活感悟", "当下意识"],
  }

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
            <span className="text-sm text-muted-foreground">2023年8月</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <h1 className="text-xl font-serif font-bold text-foreground">{diaryEntry.title}</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {diaryEntry.date} · {diaryEntry.time}
              </p>
            </div>
            <Link href={`/diary/${diaryEntry.id}/edit`}>
              <Button variant="ghost" size="icon" className="gentle-transition">
                <Edit className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <Badge className={diaryEntry.emotionColor}>{diaryEntry.emotion}</Badge>
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
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">🦊</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">AI情绪洞察</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{aiInsight.content}</p>

              <div className="flex flex-wrap gap-2 mb-2">
                {aiInsight.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">{aiInsight.date}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
