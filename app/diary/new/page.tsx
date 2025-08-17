"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Loader2, Check, Home, BookOpen, Plus, BarChart3, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { getCurrentDateInfo } from "@/lib/utils"
import { analyzeEmotionWithAI } from "@/lib/emotion-ai"
import { BackgroundWrapper } from "@/components/background-wrapper"

const emotionOptions = [
  "平静", "快乐", "兴奋", "满足", "感激", "希望", "好奇", "专注",
  "疲惫", "焦虑", "沮丧", "愤怒", "困惑", "孤独", "压力", "其他"
]

const moodTags = [
  "温暖", "清新", "宁静", "活力", "温柔", "坚定", "自由", "成长",
  "感恩", "希望", "勇气", "智慧", "美好", "简单", "真实", "独特"
]

export default function NewDiaryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [emotion, setEmotion] = useState("")
  const [weather, setWeather] = useState("")
  const [location, setLocation] = useState("")
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleEmotionSelect = (selectedEmotion: string) => {
    setEmotion(selectedEmotion)
  }

  const handleMoodTagToggle = (tag: string) => {
    if (selectedMoodTags.includes(tag)) {
      setSelectedMoodTags(selectedMoodTags.filter(t => t !== tag))
    } else if (selectedMoodTags.length < 5) {
      setSelectedMoodTags([...selectedMoodTags, tag])
    }
  }

  const handleSubmit = async () => {
    if (!user || !title.trim() || !content.trim() || !emotion) {
      alert("请填写标题、内容和选择情绪")
      return
    }

    setIsSubmitting(true)

    try {
      // 生成AI洞察（基于用户输入的内容）
      const aiInsight = `你记录了${emotion}的心情。${content.length > 50 ? '这是一篇详细的记录，' : ''}保持记录的习惯，让每一次情绪波动都成为成长的轨迹。`

      const { data: diaryEntry, error } = await supabase
        .from('diary_entries')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          emotion: emotion,
          ai_insight: aiInsight,
          mood_tags: selectedMoodTags,
          weather: weather || null,
          location: location || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log("Diary entry created:", diaryEntry)
      
      // 保存成功后，自动进行情绪分析
      try {
        console.log("开始AI情绪分析...")
        const analysisResult = await analyzeEmotionWithAI(
          title.trim(),
          content.trim(),
          emotion
        )
        
        if (analysisResult) {
          console.log("AI情绪分析完成:", analysisResult)
          
          // 更新数据库中的情绪分析结果
          const { error: updateError } = await supabase
            .from('diary_entries')
            .update({
              mood_score: analysisResult.mood_score,
              emotion_keywords: analysisResult.emotion_keywords,
              event_keywords: analysisResult.event_keywords,
              ai_analysis_updated_at: new Date().toISOString()
            })
            .eq('id', diaryEntry.id)
            .eq('user_id', user.id)
          
          if (updateError) {
            console.error("更新情绪分析结果失败:", updateError)
          } else {
            console.log("情绪分析结果已保存到数据库")
          }
        } else {
          console.warn("AI情绪分析失败")
        }
      } catch (analysisError) {
        console.error("情绪分析过程中出错:", analysisError)
        // 不影响日记保存，继续执行
      }
      
      setShowSuccess(true)
      
      // 2秒后跳转到日记详情页
      setTimeout(() => {
        router.push(`/diary/${diaryEntry.id}`)
      }, 2000)

    } catch (error) {
      console.error("Error creating diary entry:", error)
      alert("保存失败，请稍后重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <AuthGuard>
        <BackgroundWrapper>
          <div className="min-h-screen flex items-center justify-center">
            <Card className="p-8 text-center soft-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-serif font-bold text-foreground mb-2">日记保存成功！</h2>
              <p className="text-muted-foreground">正在跳转到日记详情页...</p>
            </Card>
          </div>
        </BackgroundWrapper>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <BackgroundWrapper>
        <div className="min-h-screen">
          {/* 顶部导航 */}
          <header className="flex items-center justify-between p-4 pt-12">
            <Link href="/">
              <Button variant="ghost" size="icon" className="gentle-transition">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !content.trim() || !emotion}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gentle-transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
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
              <p className="text-lg font-medium text-foreground">{getCurrentDateInfo().monthDay}</p>
            </div>

            {/* 编辑区域 */}
            <Card className="p-4 mb-6 soft-shadow bg-white">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给今天起个标题..."
                className="border-none bg-transparent text-lg font-serif font-semibold mb-4 p-0 focus-visible:ring-0"
                maxLength={100}
              />

              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="记录今天的心情和想法..."
                className="border-none bg-transparent resize-none min-h-[300px] p-0 focus-visible:ring-0 leading-relaxed"
                maxLength={1000}
              />

              {/* 字符计数 */}
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>标题: {title.length}/100</span>
                <span>内容: {content.length}/1000</span>
              </div>
            </Card>

            {/* 情绪选择 */}
            <Card className="p-4 mb-6">
              <h3 className="font-medium text-foreground mb-3">今日心情</h3>
              <div className="grid grid-cols-4 gap-2">
                {emotionOptions.map((option) => (
                  <Button
                    key={option}
                    variant={emotion === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEmotionSelect(option)}
                    className="gentle-transition"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </Card>

            {/* 心情标签 */}
            <Card className="p-4 mb-6">
              <h3 className="font-medium text-foreground mb-3">心情标签 <span className="text-muted-foreground text-sm">(最多5个)</span></h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedMoodTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleMoodTagToggle(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {moodTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedMoodTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMoodTagToggle(tag)}
                    className="gentle-transition"
                    disabled={!selectedMoodTags.includes(tag) && selectedMoodTags.length >= 5}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </Card>

            {/* 天气和位置 */}
            <Card className="p-4 mb-6">
              <h3 className="font-medium text-foreground mb-3">环境信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">天气</label>
                  <Input
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    placeholder="今天天气如何？"
                    className="gentle-transition focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">位置</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="在哪里？"
                    className="gentle-transition focus:ring-primary/20"
                  />
                </div>
              </div>
            </Card>

            {/* 提示信息 */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                你的日记将被安全保存，只有你能看到
              </p>
            </div>
          </div>
        </div>
      </BackgroundWrapper>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-[9999]">
        <div className="flex items-center justify-around py-2">
          {[
            { icon: Home, label: "首页", active: false, href: "/" },
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
    </AuthGuard>
  )
}


