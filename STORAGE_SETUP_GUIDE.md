# Supabase Storage 头像上传设置指南

## 问题描述

如果遇到以下错误：
```
statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy"
```

这是因为Supabase Storage的Row Level Security (RLS)策略没有正确配置。

## 解决方案

### 方法1：使用SQL脚本（推荐）

1. **在Supabase Dashboard中运行SQL脚本**：
   - 进入 **SQL Editor**
   - 运行 `scripts/012_setup_storage_bucket.sql`

2. **脚本功能**：
   - 创建 `user-avatars` 存储桶
   - 设置5MB文件大小限制
   - 允许常见图片格式（JPEG, PNG, GIF, WebP）
   - 配置正确的权限策略

### 方法2：手动配置

#### 步骤1：创建存储桶

1. 进入 **Supabase Dashboard** → **Storage**
2. 点击 **New bucket**
3. 设置：
   - **Name**: `user-avatars`
   - **Public bucket**: ✅ 勾选
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/*`

#### 步骤2：配置权限策略

在 **Storage** → **Policies** 中为 `user-avatars` 存储桶添加以下策略：

##### 策略1：允许用户上传自己的头像
- **Policy name**: `Users can upload their own avatars`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1])
```
- **Operation**: `INSERT`

##### 策略2：允许查看所有头像
- **Policy name**: `Users can view all avatars`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'user-avatars')
```
- **Operation**: `SELECT`

##### 策略3：允许用户更新自己的头像
- **Policy name**: `Users can update their own avatars`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1])
```
- **Operation**: `UPDATE`

##### 策略4：允许用户删除自己的头像
- **Policy name**: `Users can delete their own avatars`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1])
```
- **Operation**: `DELETE`

## 权限策略说明

### 文件路径结构
头像文件将按照以下结构存储：
```
user-avatars/
├── 1/                    # 用户ID为1的文件夹
│   ├── 1234567890_abc.jpg
│   └── 1234567891_def.png
├── 2/                    # 用户ID为2的文件夹
│   └── 1234567892_ghi.gif
└── ...
```

### 权限验证逻辑
- **上传**: 检查文件路径的第一级文件夹名是否等于当前用户ID
- **查看**: 所有认证用户都可以查看所有头像（公开访问）
- **更新/删除**: 只有文件所有者可以更新/删除自己的头像

## 测试步骤

1. **运行设置脚本**：
   ```sql
   \i scripts/012_setup_storage_bucket.sql
   ```

2. **验证存储桶**：
   - 检查 `storage.buckets` 表中是否有 `user-avatars` 记录
   - 确认 `public` 字段为 `true`

3. **验证权限策略**：
   - 检查 `pg_policies` 表中是否有4个策略
   - 确认策略名称和权限设置正确

4. **测试头像上传**：
   - 登录用户账号
   - 进入个人资料页面
   - 尝试上传头像
   - 检查控制台日志和错误信息

## 常见问题

### Q: 仍然出现权限错误
A: 检查：
- 用户是否已正确登录
- 存储桶名称是否正确（`user-avatars`）
- 权限策略是否已创建
- 文件路径格式是否正确（`user_id/filename`）

### Q: 存储桶不存在
A: 确保：
- 在正确的Supabase项目中操作
- 有足够的权限创建存储桶
- 存储桶名称没有拼写错误

### Q: 文件上传成功但无法访问
A: 检查：
- 存储桶是否设置为公开
- 文件权限策略是否正确
- 文件路径是否包含特殊字符

## 安全考虑

- 文件大小限制为5MB，防止大文件上传
- 只允许图片格式文件
- 用户只能访问自己的头像文件
- 所有头像都可以公开查看（适合头像用途）

## 下一步

设置完成后，头像上传功能应该正常工作。如果仍有问题，请检查：
1. 浏览器控制台的错误信息
2. Supabase Dashboard中的存储桶状态
3. 权限策略配置
4. 用户认证状态


