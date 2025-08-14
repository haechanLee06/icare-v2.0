"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, MoreHorizontal, Camera, Check, Home, BookOpen, Plus, BarChart3, User } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

export default function ProfilePage() {
  const [nickname, setNickname] = useState("小语")
  const [signature, setSignature] = useState("用文字记录内心的小确幸，让每一次情绪波动都成为成长的轨迹。")
  const [birthday, setBirthday] = useState("1995-06-15")
  const [selectedGender, setSelectedGender] = useState("女性")
  const [selectedTags, setSelectedTags] = useState(["平静", "内省", "文艺"])
  const [writingStyle, setWritingStyle] = useState("温柔")
  const [diaryLength, setDiaryLength] = useState([3])
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [dailyReminder, setDailyReminder] = useState(true)
  const [weeklyReview, setWeeklyReview] = useState(true)

  const genderOptions = ["女性", "男性", "其他"]
  const personalityTags = ["平静", "内省", "文艺", "感性", "理性", "乐观", "细腻", "温暖"]
  const writingStyles = ["温柔", "简约", "诗意", "理性"]

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag])
    }
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
            <h1 className="text-xl font-serif font-bold text-foreground">个人资料</h1>
          </div>
          <Button variant="ghost" size="icon" className="gentle-transition">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </header>

        <div className="px-4 pb-20">
          {/* 用户头像和基本信息 */}
          <Card className="p-6 mb-6 soft-shadow text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src="/placeholder.svg?height=80&width=80" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">小</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 gentle-transition"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <h2 className="text-xl font-serif font-bold text-foreground mb-1">{nickname}</h2>
            <p className="text-sm text-muted-foreground mb-4">情绪探索者 · 灵魂写作者</p>

            <div className="flex justify-center gap-2">
              {["平静", "内省", "文艺"].map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>

          {/* 基本信息 */}
          <Card className="p-4 mb-6 soft-shadow">
            <h3 className="font-serif font-semibold text-foreground mb-4">基本信息</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">昵称</label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="gentle-transition focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">个性签名</label>
                <Textarea
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="gentle-transition focus:ring-primary/20 min-h-[80px]"
                  placeholder="用一句话描述你的内心世界..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">生日</label>
                <Input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="gentle-transition focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">性别</label>
                <div className="flex gap-2">
                  {genderOptions.map((gender) => (
                    <Button
                      key={gender}
                      variant={selectedGender === gender ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedGender(gender)}
                      className="gentle-transition bg-transparent"
                    >
                      {gender}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">情绪关键词</label>
                <p className="text-xs text-muted-foreground mb-3">选择最多3个描述你的关键词</p>
                <div className="flex flex-wrap gap-2">
                  {personalityTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                      className="gentle-transition bg-transparent"
                      disabled={!selectedTags.includes(tag) && selectedTags.length >= 3}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 写作偏好 */}
          <Card className="p-4 mb-6 soft-shadow">
            <h3 className="font-serif font-semibold text-foreground mb-4">写作偏好</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">日记生成风格</label>
                <div className="flex gap-2">
                  {writingStyles.map((style) => (
                    <Button
                      key={style}
                      variant={writingStyle === style ? "default" : "outline"}
                      size="sm"
                      onClick={() => setWritingStyle(style)}
                      className="gentle-transition bg-transparent"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  日记生成长度 <span className="text-muted-foreground">({diaryLength[0]} 段)</span>
                </label>
                <Slider
                  value={diaryLength}
                  onValueChange={setDiaryLength}
                  max={5}
                  min={1}
                  step={1}
                  className="gentle-transition"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>简短</span>
                  <span>详细</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 定期提醒 */}
          <Card className="p-4 mb-6 soft-shadow">
            <h3 className="font-serif font-semibold text-foreground mb-4">定期提醒</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">智能提醒</p>
                  <p className="text-sm text-muted-foreground">根据你的使用习惯智能提醒</p>
                </div>
                <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">每日生活</p>
                  <p className="text-sm text-muted-foreground">每天提醒记录心情</p>
                </div>
                <Switch checked={dailyReminder} onCheckedChange={setDailyReminder} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">人生感悟</p>
                  <p className="text-sm text-muted-foreground">定期回顾和总结</p>
                </div>
                <Switch checked={weeklyReview} onCheckedChange={setWeeklyReview} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">工作学习</p>
                  <p className="text-sm text-muted-foreground">工作日提醒记录</p>
                </div>
                <Switch checked={false} onCheckedChange={() => {}} />
              </div>
            </div>
          </Card>

          {/* 保存按钮 */}
          <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-2xl soft-shadow gentle-transition hover:scale-[1.02]">
            <Check className="w-5 h-5 mr-2" />
            保存修改
          </Button>
        </div>

        {/* 底部导航 */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: Home, label: "首页", active: false, href: "/" },
              { icon: BookOpen, label: "日记", active: false, href: "/diary" },
              { icon: Plus, label: "", active: false, isCenter: true, href: "/chat" },
              { icon: BarChart3, label: "分析", active: false, href: "/insights" },
              { icon: User, label: "我的", active: true, href: "/profile" },
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
