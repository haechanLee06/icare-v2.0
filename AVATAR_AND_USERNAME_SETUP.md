# 头像上传和用户名设置功能说明

## 功能概述

我们已经实现了以下功能：

1. **动态问候语**：根据时间显示"早上好"、"中午好"、"下午好"、"晚上好"
2. **手动记录日记**：用户可以直接输入日记内容，不需要通过AI对话
3. **头像上传**：支持用户上传和更换头像
4. **用户名设置**：用户可以自定义用户名，并同步到首页显示

## 已完成的修改

### 1. 首页 (app/page.tsx)
- ✅ 使用动态问候语（`getGreeting()` 函数）
- ✅ 添加手动记录日记的入口按钮
- ✅ 确保用户头像和用户名正确显示

### 2. 手动记录日记页面 (app/diary/new/page.tsx)
- ✅ 完整的日记表单（标题、内容、情绪、标签、天气、位置）
- ✅ 情绪选择器（16种情绪选项）
- ✅ 心情标签系统（最多5个标签）
- ✅ 数据验证和保存到数据库
- ✅ 保存成功后跳转到日记详情页

### 3. Profile页面 (app/profile/page.tsx)
- ✅ 头像上传功能（支持图片文件，5MB限制）
- ✅ 用户名设置和保存
- ✅ 头像删除功能
- ✅ 完整的用户资料表单
- ✅ 数据同步到首页显示

### 4. 工具函数 (lib/utils.ts)
- ✅ 添加 `getGreeting()` 函数，根据时间生成问候语

## 需要手动设置的步骤

### 1. 设置Supabase Storage

在Supabase Dashboard中执行以下步骤：

#### 创建avatars bucket
1. 进入 **Storage** 页面
2. 点击 **New Bucket**
3. 设置：
   - Bucket name: `avatars`
   - Public bucket: ✅ 勾选（允许公开访问）
   - File size limit: `5MB`
   - Allowed MIME types: `image/*`

#### 设置存储策略
在avatars bucket的 **Policies** 标签页中创建以下策略：

**插入策略**
- Policy name: "Users can upload their own avatar"
- Target roles: `authenticated`
- Policy definition: `(bucket_id = 'avatars'::text) AND (auth.uid()::text = (storage.foldername(name))[1])`

**选择策略**
- Policy name: "Anyone can view avatars"
- Target roles: `public`
- Policy definition: `(bucket_id = 'avatars'::text)`

**更新策略**
- Policy name: "Users can update their own avatar"
- Target roles: `authenticated`
- Policy definition: `(bucket_id = 'avatars'::text) AND (auth.uid()::text = (storage.foldername(name))[1])`

**删除策略**
- Policy name: "Users can delete their own avatar"
- Target roles: `authenticated`
- Policy definition: `(bucket_id = 'avatars'::text) AND (auth.uid()::text = (storage.foldername(name))[1])`

### 2. 更新数据库表结构

在Supabase SQL Editor中执行：

```sql
-- 添加avatar_url字段到users表
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 创建索引（可选）
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url);

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar_url';
```

## 功能测试

### 1. 测试动态问候语
- 在不同时间访问首页
- 验证问候语是否正确显示

### 2. 测试头像上传
1. 进入个人资料页面
2. 点击头像下方的相机图标
3. 选择"上传头像"
4. 选择图片文件（JPG、PNG等）
5. 验证头像是否成功上传并显示

### 3. 测试用户名设置
1. 在个人资料页面修改用户名
2. 点击"保存修改"
3. 返回首页验证用户名是否正确显示

### 4. 测试手动记录日记
1. 点击首页的"手动记录日记"按钮
2. 填写日记表单
3. 保存日记
4. 验证是否成功跳转到日记详情页

## 技术实现细节

### 头像上传流程
1. 用户选择图片文件
2. 前端验证文件类型和大小
3. 生成唯一文件名：`{user_id}_{timestamp}.{ext}`
4. 上传到Supabase Storage的avatars bucket
5. 获取公共URL
6. 更新数据库中的avatar_url字段
7. 更新本地用户状态

### 用户名同步流程
1. 用户在profile页面修改用户名
2. 点击保存时更新数据库
3. 通过useAuth hook更新本地用户状态
4. 首页自动重新渲染显示新用户名

### 数据存储结构
```sql
-- users表新增字段
avatar_url TEXT -- 头像URL，可为空

-- diary_entries表（手动记录）
user_id INTEGER -- 用户ID
title VARCHAR(200) -- 日记标题
content TEXT -- 日记内容
emotion VARCHAR(50) -- 情绪
ai_insight TEXT -- AI洞察
mood_tags TEXT[] -- 心情标签
weather VARCHAR(100) -- 天气
location VARCHAR(200) -- 位置
created_at TIMESTAMP -- 创建时间
updated_at TIMESTAMP -- 更新时间
```

## 注意事项

1. **文件大小限制**：头像文件限制为5MB
2. **文件类型限制**：只允许图片文件（image/*）
3. **存储策略**：确保正确设置Supabase Storage策略
4. **数据同步**：用户名修改后需要刷新页面或等待状态更新
5. **错误处理**：上传失败时会显示错误提示

## 后续优化建议

1. **图片压缩**：在上传前压缩大图片
2. **头像裁剪**：添加头像裁剪功能
3. **批量上传**：支持多张图片上传
4. **头像预览**：上传前预览头像效果
5. **数据备份**：定期备份用户头像数据

## 总结

通过以上设置，用户现在可以：
- 看到根据时间变化的个性化问候语
- 上传和更换个人头像
- 自定义用户名并同步显示
- 手动记录日记而不依赖AI对话

所有功能都已经实现并集成到现有系统中，确保用户体验的一致性和完整性。
