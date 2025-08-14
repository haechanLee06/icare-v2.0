# Supabase 配置说明

## 问题描述
项目启动时出现错误：`supabaseUrl is required`，这是因为缺少必要的环境变量配置。

## 解决方案

### 1. 创建环境变量文件
在项目根目录创建 `.env.local` 文件（注意：此文件已被 .gitignore 忽略，不会被提交到版本控制）

### 2. 配置环境变量
在 `.env.local` 文件中添加以下内容：

\`\`\`bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 其他环境变量
NODE_ENV=development
\`\`\`

### 3. 获取 Supabase 配置值

#### 如果您还没有 Supabase 项目：
1. 访问 [https://supabase.com](https://supabase.com)
2. 创建新项目
3. 在项目设置中找到 API 部分
4. 复制 Project URL 和 anon public key

#### 如果您已有 Supabase 项目：
1. 登录 Supabase 控制台
2. 选择您的项目
3. 进入 Settings > API
4. 复制 Project URL 和 anon public key

### 4. 重启开发服务器
配置完成后，重启开发服务器：
\`\`\`bash
npm run dev
\`\`\`

## 注意事项
- 环境变量必须以 `NEXT_PUBLIC_` 开头才能在客户端使用
- `.env.local` 文件包含敏感信息，不要提交到版本控制
- 如果使用生产环境，请确保在部署平台上也配置了这些环境变量

## 临时解决方案
如果您暂时不想配置 Supabase，可以修改 `lib/supabase/client.ts` 文件，添加临时的模拟数据或禁用相关功能。
