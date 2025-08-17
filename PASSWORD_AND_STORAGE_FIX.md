# 密码Hash和头像存储问题修复指南

## 问题概述

目前项目存在两个主要问题：

1. **密码Hash问题**：数据库中的用户密码已经是hash值，但登录时又计算hash，导致双重hash，无法登录
2. **头像存储问题**：头像上传后无法访问，返回400错误

## 问题1：密码Hash修复

### 问题原因
- 数据库中的 `password_hash` 字段存储的是已经计算过的MD5 hash值
- 但 `loginUser` 函数在验证时又对用户输入的密码计算hash
- 导致 `hash(password_hash) != password_hash`，验证失败

### 解决方案
运行 `scripts/013_fix_password_hashes.sql` 脚本：

```sql
-- 重置用户密码为默认值
UPDATE users 
SET password_hash = '5d41402abc4b2a76b9719d911017c592' -- 'hello' 的MD5 hash
WHERE username = 'demo_user';
```

### 修复后的登录凭据
- **用户名**: `demo_user`
- **密码**: `hello`

## 问题2：头像存储修复

### 问题原因
- 存储桶 `user-avatars` 可能不存在或配置不正确
- 存储权限策略可能缺失或配置错误
- 文件路径结构可能不正确

### 解决方案
运行 `scripts/014_fix_avatar_storage.sql` 脚本：

```sql
-- 1. 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- 2. 创建权限策略
CREATE POLICY "Public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload to own folder" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);
```

## 修复步骤

### 步骤1：修复密码问题
1. 在Supabase SQL编辑器中运行：
   ```sql
   \i scripts/013_fix_password_hashes.sql
   ```

2. 验证修复结果：
   ```sql
   SELECT id, username, password_hash FROM users;
   ```

### 步骤2：修复存储问题
1. 在Supabase SQL编辑器中运行：
   ```sql
   \i scripts/014_fix_avatar_storage.sql
   ```

2. 验证存储桶配置：
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'user-avatars';
   ```

3. 验证权限策略：
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

### 步骤3：测试功能
1. **测试登录**：
   - 使用 `demo_user` / `hello` 登录
   - 确认登录成功

2. **测试头像上传**：
   - 进入个人资料页面
   - 上传头像
   - 确认上传成功且可以访问

## 验证查询

### 检查用户密码状态
```sql
SELECT id, username, password_hash, LENGTH(password_hash) as hash_length 
FROM users;
```

### 检查存储桶状态
```sql
SELECT 
    bucket_id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'user-avatars';
```

### 检查存储策略
```sql
SELECT 
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 常见问题

### Q: 密码修复后仍然无法登录
A: 检查：
- 确认SQL脚本执行成功
- 确认 `password_hash` 字段值正确
- 检查浏览器控制台是否有错误信息

### Q: 头像上传成功但无法访问
A: 检查：
- 存储桶是否设置为 `public = true`
- 权限策略是否正确创建
- 文件路径格式是否正确（`user_id/filename`）

### Q: 存储桶创建失败
A: 检查：
- 是否有足够的权限创建存储桶
- 存储桶名称是否已被使用
- Supabase项目配置是否正确

## 预防措施

1. **密码管理**：
   - 在生产环境中使用更安全的密码哈希算法（如bcrypt）
   - 实现密码重置功能
   - 避免在代码中硬编码密码

2. **存储管理**：
   - 定期检查存储权限策略
   - 监控存储使用情况
   - 实现文件类型和大小验证

3. **测试验证**：
   - 在开发环境中测试所有功能
   - 定期验证用户认证流程
   - 监控错误日志和用户反馈

