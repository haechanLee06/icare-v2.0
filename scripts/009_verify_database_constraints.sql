-- 验证数据库约束和数据完整性
-- 这个脚本将检查所有表的外键约束和用户数据隔离

-- 1. 检查表结构
SELECT 'Table structure check:' as info;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'diary_entries', 'tasks', 'conversations', 'messages')
ORDER BY table_name, ordinal_position;

-- 2. 检查外键约束
SELECT 'Foreign key constraints:' as info;
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('diary_entries', 'tasks', 'conversations', 'messages');

-- 3. 检查索引
SELECT 'Indexes:' as info;
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'diary_entries', 'tasks', 'conversations', 'messages')
ORDER BY tablename, indexname;

-- 4. 验证用户数据隔离
SELECT 'User data isolation verification:' as info;

-- 检查每个用户的数据
DO $$
DECLARE
    user_record RECORD;
    diary_count INTEGER;
    task_count INTEGER;
    conversation_count INTEGER;
    message_count INTEGER;
BEGIN
    RAISE NOTICE '=== User Data Isolation Report ===';
    
    FOR user_record IN SELECT id, username FROM users ORDER BY id LOOP
        -- 统计日记数量
        SELECT COUNT(*) INTO diary_count 
        FROM diary_entries 
        WHERE user_id = user_record.id;
        
        -- 统计任务数量
        SELECT COUNT(*) INTO task_count 
        FROM tasks 
        WHERE user_id = user_record.id;
        
        -- 统计对话数量
        SELECT COUNT(*) INTO conversation_count 
        FROM conversations 
        WHERE user_id = user_record.id;
        
        -- 统计消息数量（通过对话关联）
        SELECT COUNT(*) INTO message_count 
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.user_id = user_record.id;
        
        RAISE NOTICE 'User: % (ID: %) - Diaries: %, Tasks: %, Conversations: %, Messages: %', 
            user_record.username, 
            user_record.id, 
            diary_count, 
            task_count, 
            conversation_count, 
            message_count;
    END LOOP;
    
    RAISE NOTICE '=== End Report ===';
END $$;

-- 5. 检查数据完整性
SELECT 'Data integrity check:' as info;

-- 检查是否有孤立的数据
SELECT 'Orphaned diary entries:' as label, COUNT(*) as count
FROM diary_entries d
LEFT JOIN users u ON d.user_id = u.id
WHERE u.id IS NULL;

SELECT 'Orphaned tasks:' as label, COUNT(*) as count
FROM tasks t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL;

SELECT 'Orphaned conversations:' as label, COUNT(*) as count
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id
WHERE u.id IS NULL;

SELECT 'Orphaned messages:' as label, COUNT(*) as count
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE c.id IS NULL;

-- 6. 显示当前数据统计
SELECT 'Current data statistics:' as info;
SELECT 
  'Total users' as metric,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'Total diary entries' as metric,
  COUNT(*) as count
FROM diary_entries
UNION ALL
SELECT 
  'Total tasks' as metric,
  COUNT(*) as count
FROM tasks
UNION ALL
SELECT 
  'Total conversations' as metric,
  COUNT(*) as count
FROM conversations
UNION ALL
SELECT 
  'Total messages' as metric,
  COUNT(*) as count
FROM messages;

-- 7. 测试数据隔离查询
SELECT 'Data isolation test queries:' as info;
-- 这些查询应该只返回当前用户的数据
-- 替换 [USER_ID] 为实际的用户ID进行测试

-- 示例：用户1的日记
-- SELECT * FROM diary_entries WHERE user_id = 1 ORDER BY created_at DESC;

-- 示例：用户1的对话
-- SELECT * FROM conversations WHERE user_id = 1 ORDER BY created_at DESC;

-- 示例：用户1的消息（通过对话关联）
-- SELECT m.* FROM messages m
-- JOIN conversations c ON m.conversation_id = c.id
-- WHERE c.user_id = 1
-- ORDER BY m.created_at DESC;
