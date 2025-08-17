-- 设置头像存储的Supabase Storage
-- 这个脚本需要在Supabase Dashboard的Storage部分手动执行

-- 1. 创建avatars bucket
-- 在Supabase Dashboard -> Storage -> New Bucket
-- Bucket name: avatars
-- Public bucket: true (允许公开访问)
-- File size limit: 5MB
-- Allowed MIME types: image/*

-- 2. 设置存储策略
-- 在Supabase Dashboard -> Storage -> Policies

-- 为avatars bucket创建策略：

-- 插入策略（允许用户上传自己的头像）
-- Policy name: "Users can upload their own avatar"
-- Target roles: authenticated
-- Policy definition:
-- (bucket_id = 'avatars'::text) AND (auth.uid()::text = (storage.foldername(name))[1])

-- 选择策略（允许公开查看头像）
-- Policy name: "Anyone can view avatars"
-- Target roles: public
-- Policy definition:
-- (bucket_id = 'avatars'::text)

-- 更新策略（允许用户更新自己的头像）
-- Policy name: "Users can update their own avatar"
-- Target roles: authenticated
-- Policy definition:
-- (bucket_id = 'avatars'::text) AND (auth.uid()::text = (storage.foldername(name))[1])

-- 删除策略（允许用户删除自己的头像）
-- Policy name: "Users can delete their own avatar"
-- Target roles: authenticated
-- Policy definition:
-- (bucket_id = 'avatars'::text) AND (auth.uid()::text = (storage.foldername(name))[1])

-- 3. 更新users表结构（如果需要）
-- 在Supabase Dashboard -> SQL Editor中执行：

-- 添加avatar_url字段到users表
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 创建索引（可选）
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url);

-- 4. 验证设置
-- 检查users表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar_url';

-- 5. 测试头像上传功能
-- 在应用中使用以下代码测试：
/*
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('test.jpg', file, {
    cacheControl: '3600',
    upsert: false
  })

if (error) {
  console.error('Upload error:', error)
} else {
  console.log('Upload successful:', data)
}
*/
