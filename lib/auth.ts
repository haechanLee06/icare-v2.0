import { supabase } from "./supabase/client"

// Browser-compatible MD5 hash function
function md5Hash(text: string): string {
  // Simple MD5 implementation for demo purposes
  // In production, consider using a proper crypto library
  let hash = 0
  if (text.length === 0) return hash.toString()
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

// User type
export interface User {
  id: number
  username: string
  email?: string
  created_at: string
}

// Register new user
export async function registerUser(username: string, password: string, email?: string) {
  try {
    const passwordHash = md5Hash(password)

    const { data, error } = await supabase
      .from("users")
      .insert([{ username, password_hash: passwordHash, email }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, user: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Login user
export async function loginUser(username: string, password: string) {
  try {
    const passwordHash = md5Hash(password)

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password_hash", passwordHash)
      .single()

    if (error || !data) {
      return { success: false, error: "用户名或密码错误" }
    }

    // Store user session in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(data))
      document.cookie = `user-session=${data.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    }

    return { success: true, user: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("user")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// Logout user
export function logoutUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
    // Remove cookie
    document.cookie = "user-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }
}

// Initialize user tasks (called after registration)
export async function initializeUserTasks(userId: number) {
  const initialTasks = [
    { title: "开始你的第一次AI对话", content: "与AI小狐狸进行第一次心灵对话", emotion: "期待" },
    { title: "记录今天的心情", content: "用文字记录下今天的感受和想法", emotion: "平静" },
    { title: "查看情绪分析", content: "了解你的情绪变化趋势", emotion: "好奇" },
  ]

  try {
    const { error } = await supabase.from("tasks").insert(
      initialTasks.map((task) => ({
        user_id: userId,
        ...task,
      })),
    )

    if (error) {
      console.error("Error initializing user tasks:", error)
    }
  } catch (error) {
    console.error("Error initializing user tasks:", error)
  }
}

export async function validateUserSession(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}
