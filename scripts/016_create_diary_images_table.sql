-- 创建日记图片表
-- 用于存储日记相关的图片信息

-- 1. 创建diary_images表
CREATE TABLE IF NOT EXISTS diary_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diary_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_diary_images_diary_id ON diary_images(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_images_user_id ON diary_images(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_images_created_at ON diary_images(created_at);

-- 3. 启用行级安全策略
ALTER TABLE diary_images ENABLE ROW LEVEL SECURITY;

-- 4. 创建RLS策略
-- 用户可以查看自己日记的图片
CREATE POLICY "Users can view their own diary images" ON diary_images
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- 用户可以插入自己日记的图片
CREATE POLICY "Users can insert images to their own diaries" ON diary_images
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 用户可以更新自己日记的图片
CREATE POLICY "Users can update their own diary images" ON diary_images
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 用户可以删除自己日记的图片
CREATE POLICY "Users can delete their own diary images" ON diary_images
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 5. 创建触发器自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_diary_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_diary_images_updated_at
    BEFORE UPDATE ON diary_images
    FOR EACH ROW
    EXECUTE FUNCTION update_diary_images_updated_at();

-- 6. 验证表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diary_images' 
ORDER BY ordinal_position;

-- 7. 验证RLS策略
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
WHERE tablename = 'diary_images';
