# 🚀 快速设置指南

## 解决 "supabaseUrl is required" 错误

### 步骤1：创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# Windows (PowerShell)
New-Item -Path ".env.local" -ItemType File

# macOS/Linux
touch .env.local
```

### 步骤2：配置环境变量

在 `.env.local` 文件中添加以下内容：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# DeepSeek API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 环境配置
NODE_ENV=development
```

### 步骤3：获取 Supabase 配置

#### 如果你还没有 Supabase 项目：

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 或 "New Project"
3. 填写项目信息并创建
4. 等待项目初始化完成
5. 进入项目后，点击左侧菜单的 "Settings" → "API"
6. 复制 "Project URL" 和 "anon public" key

#### 如果你已有 Supabase 项目：

1. 登录 [Supabase 控制台](https://app.supabase.com)
2. 选择你的项目
3. 左侧菜单 → "Settings" → "API"
4. 复制 "Project URL" 和 "anon public" key

### 步骤4：获取 DeepSeek API 密钥

1. 访问 [https://platform.deepseek.com](https://platform.deepseek.com)
2. 注册/登录账户
3. 进入 API 管理页面
4. 创建新的 API 密钥
5. 复制 API 密钥

### 步骤5：更新 .env.local 文件

将实际的配置值替换占位符：

```bash
# 示例（请使用你的实际值）
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEEPSEEK_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456789
```

### 步骤6：重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

## 🔧 故障排除

### 常见问题：

1. **环境变量不生效**
   - 确保文件名是 `.env.local`（不是 `.env.local.txt`）
   - 重启开发服务器
   - 检查文件编码（应该是 UTF-8）

2. **Supabase 连接失败**
   - 检查 URL 格式是否正确
   - 确认 API 密钥是否有效
   - 检查网络连接

3. **DeepSeek API 调用失败**
   - 确认 API 密钥是否正确
   - 检查账户余额和配额
   - 验证网络连接

### 验证配置：

在浏览器控制台中运行以下代码验证配置：

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已配置' : '未配置')
console.log('DeepSeek Key:', process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置')
```

## 📚 更多资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)

## 🆘 需要帮助？

如果仍然遇到问题，请：

1. 检查浏览器控制台的错误信息
2. 确认所有环境变量都已正确配置
3. 重启开发服务器
4. 检查网络连接

配置完成后，AI智能回复功能就可以正常使用了！🎉
