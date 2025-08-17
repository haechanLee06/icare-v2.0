-- 修复日记图片存储策略
-- 解决POST请求400错误问题

-- 1. 检查现有的diary-images bucket
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'diary-images';

-- 2. 删除所有现有的存储策略
DROP POLICY IF EXISTS "Users can upload diary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view diary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update diary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete diary images" ON storage.objects;

-- 3. 重新创建正确的存储策略
-- 用户可以上传图片到自己的日记文件夹
CREATE POLICY "Users can upload diary images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'diary-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 用户可以查看自己日记的图片
CREATE POLICY "Users can view diary images" ON storage.objects
FOR SELECT USING (
    bucket_id = 'diary-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 用户可以更新自己日记的图片
CREATE POLICY "Users can update diary images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'diary-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 用户可以删除自己日记的图片
CREATE POLICY "Users can delete diary images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'diary-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. 验证策略创建
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
WHERE tablename = 'objects' AND policyname LIKE '%diary images%';

-- 5. 检查bucket权限设置
-- 确保bucket是public的，这样图片URL才能被访问
UPDATE storage.buckets 
SET public = true 
WHERE id = 'diary-images';

-- 6. 验证bucket设置
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'diary-images';

-- 7. 测试权限策略
-- 这个查询会显示当前用户对diary-images bucket的权限
SELECT 
    bucket_id,
    name,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'diary-images' 
LIMIT 5;
