# 个人资料功能设置指南

## 功能概述

本次更新为应用添加了完整的个人资料管理功能，包括：

1. **动态问候语**：根据时间显示"早上好"、"中午好"、"下午好"、"晚上好"
2. **头像上传**：支持用户上传个人头像
3. **用户名设置**：可以设置昵称和个性签名
4. **手动日记记录**：不依赖AI对话，用户可以直接记录日记
5. **个人资料同步**：头像和用户名在所有页面同步显示

## 设置步骤

### 1. 运行数据库脚本

在Supabase SQL编辑器中运行以下脚本：

```sql
-- 添加用户资料字段
\i scripts/010_add_user_profile_fields.sql

-- 修复数据隔离问题
\i scripts/008_fix_diary_user_isolation.sql

-- 验证数据库约束
\i scripts/009_verify_database_constraints.sql
```

### 2. 创建头像存储桶

在Supabase Dashboard中：

1. 进入 **Storage** 页面
2. 点击 **Create a new bucket**
3. 输入名称：`user-avatars`
4. 设置为 **Public** 访问权限
5. 创建存储桶

### 3. 设置存储策略

在Supabase Dashboard的 **Storage > Policies** 中，为 `user-avatars` 桶添加以下策略：

**上传策略（INSERT）：**
```sql
-- 允许认证用户上传自己的头像
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**查看策略（SELECT）：**
```sql
-- 允许所有人查看头像（公开访问）
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');
```

**更新策略（UPDATE）：**
```sql
-- 允许用户更新自己的头像
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**删除策略（DELETE）：**
```sql
-- 允许用户删除自己的头像
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 功能说明

### 1. 动态问候语

- 5:00-12:00：早上好
- 12:00-14:00：中午好  
- 14:00-18:00：下午好
- 18:00-22:00：晚上好
- 22:00-5:00：夜深了

### 2. 头像上传

- 支持格式：JPG、PNG、GIF等图片格式
- 文件大小：最大5MB
- 存储位置：Supabase Storage的`user-avatars`桶
- 文件命名：`{user_id}_{timestamp}.{ext}`

### 3. 用户名设置

- **用户名**：显示在首页和其他地方的主要标识
- **昵称**：个人资料页面的显示名称
- **个性签名**：描述个人内心世界的一句话

### 4. 手动日记记录

- 路径：`/diary/new`
- 功能：直接输入日记内容，无需AI对话
- 字段：标题、内容、情绪、心情标签、天气、位置
- 保存：自动生成AI洞察并保存到数据库

## 页面更新

### 首页 (`app/page.tsx`)
- ✅ 动态问候语
- ✅ 用户头像显示
- ✅ 用户名显示
- ✅ 手动记录日记入口

### 个人资料页 (`app/profile/page.tsx`)
- ✅ 头像上传功能
- ✅ 用户名和昵称设置
- ✅ 个性签名编辑
- ✅ 个人偏好设置
- ✅ 数据保存功能

### 手动日记页 (`app/diary/new/page.tsx`)
- ✅ 日记表单
- ✅ 情绪选择
- ✅ 心情标签
- ✅ 天气位置记录
- ✅ 自动保存

## 数据同步

### 用户资料表结构

```sql
users表新增字段：
- nickname: VARCHAR(100) - 昵称
- signature: TEXT - 个性签名  
- birthday: DATE - 生日
- gender: VARCHAR(20) - 性别
- personality_tags: TEXT[] - 个性标签
- writing_style: VARCHAR(50) - 写作风格
- diary_length: INTEGER - 日记长度
- avatar_url: TEXT - 头像URL
- updated_at: TIMESTAMP - 更新时间
```

### 数据流程

1. **用户注册** → 创建基础用户记录
2. **访问个人资料** → 加载用户资料，设置默认值
3. **修改资料** → 更新数据库，显示成功提示
4. **首页显示** → 加载用户资料，显示头像和用户名
5. **头像上传** → 上传到Storage，更新数据库URL

## 测试验证

### 1. 功能测试

- [ ] 用户注册和登录
- [ ] 头像上传功能
- [ ] 用户名和昵称修改
- [ ] 个人资料保存
- [ ] 首页显示用户信息
- [ ] 手动日记记录
- [ ] 数据同步验证

### 2. 数据验证

- [ ] 用户资料字段正确创建
- [ ] 头像文件正确上传
- [ ] 数据库记录正确更新
- [ ] 首页正确显示用户信息
- [ ] 日记记录正确保存

### 3. 权限验证

- [ ] 用户只能修改自己的资料
- [ ] 用户只能上传自己的头像
- [ ] 头像文件正确访问权限
- [ ] 数据隔离正常工作

## 注意事项

1. **存储桶权限**：确保`user-avatars`桶设置为公开访问
2. **文件大小限制**：头像文件限制为5MB
3. **数据备份**：运行脚本前建议备份数据库
4. **测试环境**：建议先在测试环境中验证功能
5. **错误处理**：所有操作都有适当的错误处理和用户提示

## 故障排除

### 常见问题

1. **头像上传失败**
   - 检查存储桶权限设置
   - 验证文件大小和格式
   - 检查网络连接

2. **用户信息不显示**
   - 确认数据库脚本已运行
   - 检查用户认证状态
   - 验证数据加载逻辑

3. **数据不同步**
   - 检查数据库更新逻辑
   - 验证状态管理
   - 确认页面刷新逻辑

### 调试方法

1. 查看浏览器控制台日志
2. 检查Supabase Dashboard日志
3. 验证数据库查询结果
4. 测试API端点响应

## 总结

通过以上设置，应用将具备完整的个人资料管理功能，用户可以：

- 上传和设置个人头像
- 修改用户名和个性签名
- 设置个人偏好和写作风格
- 手动记录日记内容
- 在所有页面看到同步的个人信息

这些功能将大大提升用户体验，让应用更加个性化和易用。


