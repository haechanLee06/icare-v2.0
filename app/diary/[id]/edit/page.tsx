"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function EditDiaryPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState("夏日的小幸")
  const [content, setContent] =
    useState(`今天的天气很温暖，民过同市雨在车里看上，便感到我接触了一个小小的温暖风景。我接着一杯茶水，轻嗅一口，便感觉温暖人心的小确幸延续到全身。

午后，我打开了一本书，它让我想起了童年时光。那些简单而美好的记忆，像是夏日午后的蝉鸣，总是能让人感到温暖。

这些小小的幸福瞬间，构成了我们生活的底色。`)

  const editingTools = [
    { name: "添加照片", icon: "📷", color: "bg-pink-100 text-pink-600" },
    { name: "音频", icon: "🎵", color: "bg-purple-100 text-purple-600" },
    { name: "字体", icon: "A", color: "bg-blue-100 text-blue-600" },
    { name: "情绪", icon: "😊", color: "bg-yellow-100 text-yellow-600" },
  ]

  const backgrounds = [
    { name: "默认", color: "bg-white", preview: "bg-white border-2 border-gray-200" },
    { name: "温暖", color: "bg-orange-50", preview: "bg-orange-50 border-2 border-orange-200" },
    { name: "清新", color: "bg-green-50", preview: "bg-green-50 border-2 border-green-200" },
    { name: "宁静", color: "bg-blue-50", preview: "bg-blue-50 border-2 border-blue-200" },
  ]

  const [selectedBackground, setSelectedBackground] = useState(backgrounds[0])

  return (
    <div className="min-h-screen bg-background paper-texture">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between p-4 pt-12">
        <Link href={`/diary/${params.id}`}>
          <Button variant="ghost" size="icon" className="gentle-transition">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gentle-transition">
          <Save className="w-4 h-4 mr-2" />
          保存
        </Button>
      </header>

      <div className="px-4 pb-20">
        {/* 日期标题 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-sm text-muted-foreground">今日记录</span>
          </div>
          <p className="text-lg font-medium text-foreground">8月13日</p>
        </div>

        {/* 编辑区域 */}
        <Card className={`p-4 mb-6 soft-shadow ${selectedBackground.color}`}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给今天起个标题..."
            className="border-none bg-transparent text-lg font-serif font-semibold mb-4 p-0 focus-visible:ring-0"
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记录今天的心情和想法..."
            className="border-none bg-transparent resize-none min-h-[300px] p-0 focus-visible:ring-0 leading-relaxed"
          />

          {/* 示例图片 */}
          <div className="flex gap-2 mt-4">
            <div className="w-16 h-16 bg-yellow-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌻</span>
            </div>
            <div className="w-16 h-16 bg-green-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🦋</span>
            </div>
          </div>
        </Card>

        {/* 编辑工具 */}
        <div className="mb-6">
          <h3 className="font-medium text-foreground mb-3">编辑工具</h3>
          <div className="grid grid-cols-4 gap-3">
            {editingTools.map((tool) => (
              <Button
                key={tool.name}
                variant="outline"
                className={`h-16 flex flex-col items-center gap-1 ${tool.color} border-current/20 gentle-transition hover:scale-105`}
              >
                <span className="text-lg">{tool.icon}</span>
                <span className="text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* 背景选择 */}
        <div className="mb-6">
          <h3 className="font-medium text-foreground mb-3">背景选择</h3>
          <div className="grid grid-cols-4 gap-3">
            {backgrounds.map((bg) => (
              <Button
                key={bg.name}
                variant="outline"
                onClick={() => setSelectedBackground(bg)}
                className={`h-16 flex flex-col items-center gap-2 p-2 ${
                  selectedBackground.name === bg.name ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className={`w-8 h-6 rounded ${bg.preview}`}></div>
                <span className="text-xs">{bg.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* 今日心情 */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-3">今日心情</h3>
          <div className="flex gap-2">
            {["😊", "😌", "🤔", "😴"].map((emoji, index) => (
              <Button
                key={index}
                variant="outline"
                size="icon"
                className="w-12 h-12 text-xl gentle-transition hover:scale-110 bg-transparent"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
