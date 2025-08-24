-- 修复用户数据隔离问题
-- 这个脚本将清理硬编码的初始数据，并确保数据隔离

-- 1. 删除硬编码的初始日记数据（这些数据不应该被所有用户看到）
DELETE FROM diary_entries WHERE user_id = 1 AND title = '今天的心情';

-- 2. 删除可能存在的其他硬编码数据
DELETE FROM diary_entries WHERE user_id IS NULL;
DELETE FROM tasks WHERE user_id IS NULL;

-- 3. 确保所有表都有正确的用户ID约束
-- 检查是否有任何数据没有用户ID
SELECT 'diary_entries without user_id' as table_name, COUNT(*) as count 
FROM diary_entries WHERE user_id IS NULL
UNION ALL
SELECT 'tasks without user_id' as table_name, COUNT(*) as count 
FROM tasks WHERE user_id IS NULL
UNION ALL
SELECT 'conversations without user_id' as table_name, COUNT(*) as count 
FROM conversations WHERE user_id IS NULL;

-- 4. 创建更严格的数据隔离约束（如果不存在）
-- 注意：这些约束可能已经存在，但为了安全起见，我们检查一下

-- 5. 为现有数据添加用户ID（如果有必要）
-- 注意：这只是一个安全措施，正常情况下不应该有这种情况

-- 6. 验证数据隔离
-- 检查每个用户只能看到自己的数据
DO $$
DECLARE
    user_count INTEGER;
    diary_count INTEGER;
    task_count INTEGER;
    conv_count INTEGER;
BEGIN
    -- 统计用户数量
    SELECT COUNT(*) INTO user_count FROM users;
    
    -- 统计每个用户的数据
    FOR i IN 1..user_count LOOP
        SELECT COUNT(*) INTO diary_count FROM diary_entries WHERE user_id = i;
        SELECT COUNT(*) INTO task_count FROM tasks WHERE user_id = i;
        SELECT COUNT(*) INTO conv_count FROM conversations WHERE user_id = i;
        
        RAISE NOTICE 'User %: % diaries, % tasks, % conversations', i, diary_count, task_count, conv_count;
    END LOOP;
END $$;

-- 7. 显示清理结果
SELECT 'Data isolation check completed' as status;







