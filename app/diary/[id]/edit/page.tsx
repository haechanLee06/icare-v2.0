"use client"

import { useState, useEffect, useRef, use } from "react"
import { getCurrentDateInfo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { analyzeEmotionWithAI } from "@/lib/emotion-ai"
import { generateAIInsight } from "@/lib/ai-insight-generator"

interface DiaryImage {
  id: string
  url: string
  filename: string
  file_path: string
  created_at: string
}

export default function EditDiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [emotion, setEmotion] = useState("")
  const [weather, setWeather] = useState("")
  const [location, setLocation] = useState("")
  const [moodTags, setMoodTags] = useState<string[]>([])
  const [images, setImages] = useState<DiaryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  const editingTools = [
    { name: "添加照片", icon: "📷", color: "bg-pink-100 text-pink-600", action: "upload" },
    { name: "音频", icon: "🎵", color: "bg-purple-100 text-purple-600", action: "audio" },
    { name: "字体", icon: "A", color: "bg-blue-100 text-blue-600", action: "font" },
    { name: "情绪", icon: "😊", color: "bg-yellow-100 text-yellow-600", action: "emotion" },
  ]

  const backgrounds = [
    { name: "默认", color: "bg-white", preview: "bg-white border-2 border-gray-200" },
    { name: "温暖", color: "bg-orange-50", preview: "bg-orange-50 border-2 border-orange-200" },
    { name: "清新", color: "bg-green-50", preview: "bg-green-50 border-2 border-green-200" },
    { name: "宁静", color: "bg-blue-50", preview: "bg-blue-50 border-2 border-blue-200" },
  ]

  const [selectedBackground, setSelectedBackground] = useState(backgrounds[0])

  // 加载日记内容
  useEffect(() => {
    if (id && user) {
      loadDiaryContent()
    }
  }, [id, user])

  const loadDiaryContent = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError("")

      // 获取日记内容
      const { data: diary, error: diaryError } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (diaryError) {
        throw diaryError
      }

      if (!diary) {
        setError("日记不存在")
        return
      }

      setTitle(diary.title || "")
      setContent(diary.content || "")
      setEmotion(diary.emotion || "")
      setWeather(diary.weather || "")
      setLocation(diary.location || "")
      setMoodTags(diary.mood_tags || [])

      // 获取日记图片
      const { data: diaryImages, error: imagesError } = await supabase
        .from('diary_images')
        .select('*')
        .eq('diary_id', id)
        .order('created_at', { ascending: true })

      if (imagesError) {
        console.error("Error loading images:", imagesError)
      } else {
        setImages(diaryImages || [])
      }

    } catch (error) {
      console.error("Error loading diary:", error)
      setError("加载日记失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return
    
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // 验证文件类型和大小
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB限制
      alert('图片大小不能超过5MB')
      return
    }

    try {
      setIsUploading(true)
      
      // 生成唯一文件名
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const filename = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
      const filePath = `${user.id}/${id}/${filename}`

      console.log("=== 图片上传调试信息 ===")
      console.log("用户信息:", { userId: user.id, userEmail: user.email })
      console.log("日记ID:", id, "类型:", typeof id)
      console.log("文件信息:", { filePath, fileSize: file.size, mimeType: file.type })
      console.log("Supabase客户端:", !!supabase)

      // 上传到Supabase Storage
      console.log("开始上传到Storage...")
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diary-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error("Storage上传错误:", uploadError)
        throw uploadError
      }

      console.log("Storage上传成功:", uploadData)

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('diary-images')
        .getPublicUrl(filePath)

      console.log("公共URL:", urlData)

      // 准备数据库插入数据
      const imageData = {
        diary_id: parseInt(id),
        user_id: user.id,
        filename: filename,
        url: urlData.publicUrl,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type
      }

      console.log("准备插入数据库的数据:", imageData)

      // 保存图片信息到数据库
      console.log("开始插入数据库...")
      const { data: imageRecord, error: dbError } = await supabase
        .from('diary_images')
        .insert(imageData)
        .select()
        .single()

      if (dbError) {
        console.error("数据库插入错误:", dbError)
        console.error("错误详情:", {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint
        })
        throw dbError
      }

      console.log("数据库插入成功:", imageRecord)

      // 更新本地状态
      setImages(prev => [...prev, imageRecord])
      
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      alert('图片上传成功！')

    } catch (error: any) {
      console.error("=== 图片上传失败 ===")
      console.error("错误对象:", error)
      console.error("错误类型:", typeof error)
      console.error("错误消息:", error.message || error)
      
      if (error.code) {
        console.error("错误代码:", error.code)
      }
      
      if (error.details) {
        console.error("错误详情:", error.details)
      }
      
      if (error.hint) {
        console.error("错误提示:", error.hint)
      }

      alert(`图片上传失败：${error.message || '未知错误'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // 删除图片
  const handleDeleteImage = async (imageId: string, filePath: string) => {
    try {
      // 从Storage删除文件
      const { error: storageError } = await supabase.storage
        .from('diary-images')
        .remove([filePath])

      if (storageError) {
        console.error("Error deleting from storage:", storageError)
      }

      // 从数据库删除记录
      const { error: dbError } = await supabase
        .from('diary_images')
        .delete()
        .eq('id', imageId)

      if (dbError) {
        throw dbError
      }

      // 更新本地状态
      setImages(prev => prev.filter(img => img.id !== imageId))

    } catch (error) {
      console.error("Error deleting image:", error)
      alert('删除图片失败，请稍后重试')
    }
  }

  // 处理工具点击
  const handleToolClick = (action: string) => {
    if (action === 'upload') {
      fileInputRef.current?.click()
    }
    // 其他工具功能可以在这里添加
  }

  // 保存日记
  const handleSave = async () => {
    if (!user) return
    
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容')
      return
    }

    try {
      setIsSaving(true)
      
      const { error } = await supabase
        .from('diary_entries')
        .update({
          title: title.trim(),
          content: content.trim(),
          emotion: emotion,
          weather: weather || null,
          location: location || null,
          mood_tags: moodTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      // 保存成功后，需要重新生成AI洞察和情绪分析
      try {
        console.log("开始重新生成AI洞察和情绪分析...")
        
        // 调用AI洞察生成
        const aiInsight = await generateAIInsight({
          title: title.trim(),
          content: content.trim(),
          emotion
        })
        
        // 调用AI情绪分析
        const analysisResult = await analyzeEmotionWithAI(
          title.trim(),
          content.trim(),
          emotion
        )
        
        if (analysisResult) {
          console.log("AI情绪分析完成:", analysisResult)
          
          // 更新数据库中的AI洞察和情绪分析结果
          const { error: updateError } = await supabase
            .from('diary_entries')
            .update({
              ai_insight: aiInsight,
              mood_score: analysisResult.mood_score,
              emotion_keywords: analysisResult.emotion_keywords,
              event_keywords: analysisResult.event_keywords,
              ai_analysis_updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id)
          
          if (updateError) {
            console.error("更新AI洞察和情绪分析结果失败:", updateError)
          } else {
            console.log("AI洞察和情绪分析结果已保存到数据库")
          }
        } else {
          console.warn("AI情绪分析失败")
        }
      } catch (analysisError) {
        console.error("重新生成AI洞察和情绪分析过程中出错:", analysisError)
        // 不影响日记保存，继续执行
      }

      alert('保存成功！')
      router.push(`/diary/${id}`)

    } catch (error) {
      console.error("Error saving diary:", error)
      alert('保存失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background paper-texture flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background paper-texture flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/diary">
              <Button>返回日记列表</Button>
            </Link>
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
          <Link href={`/diary/${id}`}>
            <Button variant="ghost" size="icon" className="gentle-transition">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gentle-transition"
          >
            {isSaving ? (
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
              <span className="text-sm text-muted-foreground">编辑记录</span>
            </div>
            <p className="text-lg font-medium text-foreground">{getCurrentDateInfo().monthDay}</p>
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

            {/* 图片展示区域 */}
            {images.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/20">
                <h4 className="text-sm font-medium text-foreground mb-3">已添加的图片</h4>
                <div className="grid grid-cols-3 gap-3">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt="日记图片"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteImage(image.id, image.file_path)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* 编辑工具 - 暂时注释掉
          <div className="mb-6">
            <h3 className="font-medium text-foreground mb-3">编辑工具</h3>
            <div className="grid grid-cols-4 gap-3">
              {editingTools.map((tool) => (
                <Button
                  key={tool.name}
                  variant="outline"
                  onClick={() => handleToolClick(tool.action)}
                  className={`h-16 flex flex-col items-center gap-1 ${tool.color} border-current/20 gentle-transition hover:scale-105`}
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span className="text-xs">{tool.name}</span>
                </Button>
              ))}
            </div>
          </div>
          */}

          {/* 背景选择 - 暂时注释掉
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
          */}

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

          {/* 隐藏的文件输入 - 暂时注释掉
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          */}
        </div>
      </div>
    </AuthGuard>
  )
}
