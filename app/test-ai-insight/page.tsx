"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function TestAIInsightPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [emotion, setEmotion] = useState("")
  const [aiInsight, setAiInsight] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerateInsight = async () => {
    if (!title || !content) {
      setError("请填写标题和内容")
      return
    }

    setLoading(true)
    setError("")

    try {
      // 获取当前用户信息
      const userStr = localStorage.getItem("user")
      if (!userStr) {
        setError("用户未登录，请先登录")
        return
      }

      const user = JSON.parse(userStr)

      const response = await fetch("/api/diary/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          title,
          content,
          emotion: emotion || "平静",
        }),
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setAiInsight(result.diary.ai_insight)
      } else {
        throw new Error(result.error || "生成失败")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI情绪洞察测试</h1>
          <p className="text-muted-foreground">测试AI洞察生成功能</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>输入日记内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">标题</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给今天起个标题..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">内容</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="记录今天的心情和想法..."
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">情绪标签（可选）</label>
              <Input
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                placeholder="例如：快乐、平静、焦虑..."
              />
            </div>

            <Button
              onClick={handleGenerateInsight}
              disabled={loading || !title || !content}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  生成AI洞察中...
                </>
              ) : (
                "生成AI洞察"
              )}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {aiInsight && (
          <Card>
            <CardHeader>
              <CardTitle>AI情绪洞察</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground leading-relaxed">{aiInsight}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
