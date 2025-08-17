-- 设置日记图片存储
-- 创建Supabase Storage bucket和策略

-- 1. 创建diary-images存储bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'diary-images', 
    'diary-images', 
    true, 
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- 2. 删除现有的存储策略（如果存在）
DROP POLICY IF EXISTS "Users can upload diary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view diary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update diary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete diary images" ON storage.objects;

-- 3. 创建新的存储策略
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

-- 4. 验证bucket创建
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'diary-images';

-- 5. 验证存储策略
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
