"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Loader2 } from "lucide-react"
import { registerUser, initializeUserTasks } from "@/lib/auth"
import { useAuth } from "@/contexts/auth-context"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await registerUser(username, password, email)

      if (result.success && result.user) {
        // Initialize user tasks
        await initializeUserTasks(result.user.id)

        // Login user
        login(result.user)
        router.push("/")
      } else {
        setError(result.error || "注册失败")
      }
    } catch (err) {
      setError("注册过程中出现错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-warm-cream via-soft-gray to-warm-cream">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warm-purple rounded-full mb-4 soft-shadow">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-warm-purple mb-2 font-handwriting">心语迹</h1>
          <p className="text-gray-600">开启你的心灵记录之旅</p>
        </div>

        <Card className="soft-shadow border-0 bg-white/80 backdrop-blur-sm paper-texture">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-handwriting text-warm-purple">创建账户</CardTitle>
            <CardDescription className="text-gray-600">加入我们，开始记录你的情感轨迹</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}

              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  用户名
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                  className="h-12 rounded-xl border-gray-200 focus:border-warm-purple focus:ring-warm-purple/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  邮箱 (可选)
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱地址"
                  className="h-12 rounded-xl border-gray-200 focus:border-warm-purple focus:ring-warm-purple/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  className="h-12 rounded-xl border-gray-200 focus:border-warm-purple focus:ring-warm-purple/20"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-warm-purple hover:bg-warm-purple-dark text-black font-medium rounded-xl soft-shadow gentle-transition hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    注册中...
                  </>
                ) : (
                  "注册"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                已有账户？{" "}
                <Link
                  href="/auth/login"
                  className="text-warm-purple hover:text-warm-purple-dark font-medium gentle-transition"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
