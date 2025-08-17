-- 修复头像存储问题
-- 问题：头像上传后无法访问，返回400错误

-- 1. 检查存储桶是否存在
SELECT * FROM storage.buckets WHERE id = 'user-avatars';

-- 2. 如果存储桶不存在，创建它
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public, 
    file_size_limit = EXCLUDED.file_size_limit, 
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. 删除现有的存储策略（如果存在）
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- 4. 创建新的存储策略
-- 策略1：公开读取访问
CREATE POLICY "Public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'user-avatars');

-- 策略2：用户上传到自己的文件夹
CREATE POLICY "Users can upload to own folder" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 策略3：用户更新自己的头像
CREATE POLICY "Users can update their own avatars" ON storage.objects 
FOR UPDATE USING (
    bucket_id = 'user-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 策略4：用户删除自己的头像
CREATE POLICY "Users can delete their own avatars" ON storage.objects 
FOR DELETE USING (
    bucket_id = 'user-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. 验证策略是否创建成功
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
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 6. 检查存储桶权限
SELECT 
    bucket_id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'user-avatars';

-- 7. 测试文件访问权限（可选）
-- 这个查询会显示当前用户是否有权限访问存储桶
SELECT 
    bucket_id,
    name,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'user-avatars'
LIMIT 5;

