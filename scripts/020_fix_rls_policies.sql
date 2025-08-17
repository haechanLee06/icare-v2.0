-- 修复日记图片的RLS策略问题
-- 解决"new row violates row-level security policy"错误

-- 1. 检查diary_images表是否存在RLS策略
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

-- 2. 删除现有的RLS策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own diary images" ON diary_images;
DROP POLICY IF EXISTS "Users can insert images to their own diaries" ON diary_images;
DROP POLICY IF EXISTS "Users can update their own diary images" ON diary_images;
DROP POLICY IF EXISTS "Users can delete their own diary images" ON diary_images;

-- 3. 重新创建正确的RLS策略
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

-- 4. 验证RLS策略创建
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

-- 5. 检查diary_images表的RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'diary_images';

-- 6. 确保RLS已启用
ALTER TABLE diary_images ENABLE ROW LEVEL SECURITY;

-- 7. 检查用户认证状态
-- 这个查询会显示当前认证的用户ID
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 8. 测试RLS策略
-- 尝试插入一条测试记录（这可能会失败，但会显示具体的错误信息）
-- 注意：这个测试需要在有用户认证的情况下运行

-- 9. 检查表结构和约束
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diary_images' 
ORDER BY ordinal_position;

-- 10. 检查外键约束
SELECT 
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

-- 11. 验证用户表结构
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- 12. 验证日记表结构
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'diary_entries' AND column_name = 'id';
