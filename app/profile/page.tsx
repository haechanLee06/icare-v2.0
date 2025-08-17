"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, MoreHorizontal, Check, Home, BookOpen, Plus, BarChart3, User, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { avatarLibrary, AvatarOption, getAvatarById } from "@/lib/avatar-library"

export default function ProfilePage() {
  const { user, loading } = useAuth()
  
  // 用户信息状态
  const [username, setUsername] = useState("")
  const [birthday, setBirthday] = useState("1995-06-15")
  
  // 写作偏好状态
  const [writingStyle, setWritingStyle] = useState("温柔")
  const [diaryLength, setDiaryLength] = useState([3])
  
  // 头像相关状态
  const [selectedAvatarId, setSelectedAvatarId] = useState("")
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const writingStyles = ["温柔", "简约", "诗意", "理性"]

  // 加载用户信息
  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      // 从数据库加载用户资料
      const { data: profile, error } = await supabase
        .from('users')
        .select('username, birthday, writing_style, diary_length, avatar_id')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error loading profile:", error)
      }

      if (profile) {
        setUsername(profile.username || "")
        setBirthday(profile.birthday || "1995-06-15")
        setWritingStyle(profile.writing_style || "温柔")
        setDiaryLength(profile.diary_length ? [profile.diary_length] : [3])
        setSelectedAvatarId(profile.avatar_id || "avatar_001")
      } else {
        // 如果没有找到资料，使用默认值
        setUsername(user.username || "")
        setSelectedAvatarId("avatar_001")
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatarId(avatarId)
    setIsAvatarSelectorOpen(false)
  }

  const getCurrentAvatar = (): AvatarOption => {
    return getAvatarById(selectedAvatarId) || avatarLibrary[0]
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      // 更新用户资料到数据库
      const { error } = await supabase
        .from('users')
        .update({
          username: username,
          birthday: birthday,
          writing_style: writingStyle,
          diary_length: diaryLength[0],
          avatar_id: selectedAvatarId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      console.log("Profile updated successfully")
      setShowSuccess(true)
      
      // 3秒后隐藏成功提示
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)

    } catch (error) {
      console.error("Error updating profile:", error)
      alert('保存失败，请稍后重试')
    } finally {
      setIsSaving(false)
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
                <AvatarImage src={getCurrentAvatar().url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {username?.charAt(0)?.toUpperCase() || "用"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                onClick={() => setIsAvatarSelectorOpen(!isAvatarSelectorOpen)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 gentle-transition"
              >
                {isAvatarSelectorOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            <h2 className="text-xl font-serif font-bold text-foreground mb-1">{username || "用户"}</h2>
            <p className="text-sm text-muted-foreground mb-4">情绪探索者 · 灵魂写作者</p>

            {/* 头像选择器 */}
            {isAvatarSelectorOpen && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-3">选择头像</h4>
                <div className="grid grid-cols-3 gap-3">
                  {avatarLibrary.map((avatar) => (
                    <div
                      key={avatar.id}
                      className={`relative cursor-pointer rounded-lg p-2 transition-all ${
                        selectedAvatarId === avatar.id
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-background hover:bg-muted/50'
                      }`}
                      onClick={() => handleAvatarSelect(avatar.id)}
                    >
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarImage src={avatar.url} />
                      </Avatar>
                      {selectedAvatarId === avatar.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* 基本信息 */}
          <Card className="p-4 mb-6 soft-shadow">
            <h3 className="font-serif font-semibold text-foreground mb-4">基本信息</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">用户名</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="gentle-transition focus:ring-primary/20"
                  placeholder="设置你的用户名"
                />
                <p className="text-xs text-muted-foreground mt-1">用户名将显示在首页和其他地方</p>
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

          {/* 保存按钮 */}
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-2xl soft-shadow gentle-transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                保存修改
              </>
            )}
          </Button>

          {/* 成功提示 */}
          {showSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
              ✓ 个人资料保存成功！
            </div>
          )}
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
