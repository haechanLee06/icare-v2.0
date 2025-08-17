-- 设置头像存储桶和权限策略
-- 这个脚本将创建user-avatars存储桶并配置正确的权限策略

-- 1. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars', 
  'user-avatars', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 删除现有的策略（如果存在）
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- 3. 创建权限策略
-- 允许用户上传自己的头像（文件路径格式：user_id/filename）
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许用户查看所有头像（公开访问）
CREATE POLICY "Users can view all avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

-- 允许用户更新自己的头像
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许用户删除自己的头像
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. 验证存储桶设置
SELECT 'Storage bucket setup completed:' as info;
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'user-avatars';

-- 5. 验证权限策略
SELECT 'Storage policies created:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND tablename = 'objects';

-- 6. 测试权限策略（可选）
-- 注意：这些查询需要在有用户认证的情况下运行
-- SELECT storage.foldername('123/avatar.jpg') as folder_name;
-- SELECT (storage.foldername('123/avatar.jpg'))[1] as user_id;


