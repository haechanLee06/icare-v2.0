-- 测试RLS策略的调试脚本
-- 帮助诊断"new row violates row-level security policy"错误

-- 1. 检查当前认证状态
SELECT 
    '认证状态' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.jwt() as jwt_exists;

-- 2. 检查diary_images表是否存在
SELECT 
    '表存在性检查' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'diary_images'
    ) as table_exists;

-- 3. 如果表存在，检查其结构
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'diary_images'
    ) THEN
        RAISE NOTICE 'diary_images表存在，检查结构...';
        
        -- 检查列结构
        PERFORM 
            column_name,
            data_type,
            is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'diary_images';
        
        -- 检查RLS状态
        PERFORM 
            schemaname,
            tablename,
            rowsecurity
        FROM pg_tables 
        WHERE tablename = 'diary_images';
        
        -- 检查RLS策略
        PERFORM 
            policyname,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE tablename = 'diary_images';
        
    ELSE
        RAISE NOTICE 'diary_images表不存在！';
    END IF;
END $$;

-- 4. 检查用户表结构
SELECT 
    '用户表结构' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- 5. 检查日记表结构
SELECT 
    '日记表结构' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'diary_entries' AND column_name = 'id';

-- 6. 尝试手动插入测试数据（需要用户认证）
-- 注意：这个测试需要在有用户认证的情况下运行
-- 如果失败，会显示具体的错误信息

-- 7. 检查是否有其他表的RLS策略冲突
SELECT 
    '其他表的RLS策略' as info,
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('users', 'diary_entries')
ORDER BY tablename, policyname;

-- 8. 验证外键约束
SELECT 
    '外键约束检查' as info,
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
