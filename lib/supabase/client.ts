import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase 环境变量未配置!")
  console.error("请创建 .env.local 文件并配置以下环境变量:")
  console.error("NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url")
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key")
  
  // 在开发环境中提供更友好的错误提示
  if (typeof window !== 'undefined') {
    throw new Error(
      "Supabase 配置缺失！请检查 .env.local 文件中的环境变量配置。\n" +
      "参考 env.example 文件获取配置说明。"
    )
  }
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key"
)
