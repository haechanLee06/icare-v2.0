-- 修复日记图片表的外键类型问题
-- 确保与diary_entries和users表的id字段类型匹配

-- 1. 删除现有的diary_images表（如果存在）
DROP TABLE IF EXISTS diary_images CASCADE;

-- 2. 重新创建diary_images表，使用正确的数据类型
CREATE TABLE diary_images (
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

-- 3. 创建索引以提高查询性能
CREATE INDEX idx_diary_images_diary_id ON diary_images(diary_id);
CREATE INDEX idx_diary_images_user_id ON diary_images(user_id);
CREATE INDEX idx_diary_images_created_at ON diary_images(created_at);

-- 4. 启用行级安全策略
ALTER TABLE diary_images ENABLE ROW LEVEL SECURITY;

-- 5. 创建RLS策略
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

-- 6. 创建触发器自动更新updated_at字段
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

-- 7. 验证表结构
SELECT 
    'diary_images表结构' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diary_images' 
ORDER BY ordinal_position;

-- 8. 验证外键约束
SELECT 
    '外键约束' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'diary_images';

-- 9. 验证RLS策略
SELECT 
    'RLS策略' as info,
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

-- 10. 验证相关表的数据类型
SELECT 
    '相关表ID字段类型' as info,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE (table_name = 'diary_entries' AND column_name = 'id')
   OR (table_name = 'users' AND column_name = 'id');
