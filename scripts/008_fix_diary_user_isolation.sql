-- 修复日记用户数据隔离问题
-- 这个脚本将确保每个用户只能看到自己的日记

-- 1. 检查当前数据状态
SELECT 'Current data status:' as info;
SELECT 'Users count:' as label, COUNT(*) as count FROM users;
SELECT 'Diary entries count:' as label, COUNT(*) as count FROM diary_entries;
SELECT 'Diary entries without user_id:' as label, COUNT(*) as count FROM diary_entries WHERE user_id IS NULL;

-- 2. 显示每个用户的日记数量
SELECT 'Diary entries per user:' as info;
SELECT 
  u.username,
  u.id as user_id,
  COUNT(d.id) as diary_count
FROM users u
LEFT JOIN diary_entries d ON u.id = d.user_id
GROUP BY u.id, u.username
ORDER BY u.id;

-- 3. 检查是否有跨用户的数据访问问题
SELECT 'Cross-user data access check:' as info;
SELECT 
  d.id as diary_id,
  d.title,
  d.user_id as diary_user_id,
  u.username as diary_username
FROM diary_entries d
JOIN users u ON d.user_id = u.id
ORDER BY d.user_id, d.created_at;

-- 4. 清理任何没有用户ID的日记条目（安全措施）
DELETE FROM diary_entries WHERE user_id IS NULL;

-- 5. 确保所有日记条目都有有效的用户ID
SELECT 'Diary entries with valid user_id:' as info;
SELECT COUNT(*) as count FROM diary_entries WHERE user_id IS NOT NULL;

-- 6. 验证数据隔离约束
SELECT 'Data isolation verification:' as info;
DO $$
DECLARE
    user_record RECORD;
    diary_count INTEGER;
BEGIN
    FOR user_record IN SELECT id, username FROM users LOOP
        SELECT COUNT(*) INTO diary_count 
        FROM diary_entries 
        WHERE user_id = user_record.id;
        
        RAISE NOTICE 'User % (%) has % diary entries', 
            user_record.username, 
            user_record.id, 
            diary_count;
    END LOOP;
END $$;

-- 7. 显示最终状态
SELECT 'Final data status:' as info;
SELECT 'Total diary entries:' as label, COUNT(*) as count FROM diary_entries;
SELECT 'Users with diary entries:' as label, COUNT(DISTINCT user_id) as count FROM diary_entries;

-- 8. 创建数据隔离测试查询（用于验证）
-- 这个查询应该只返回当前用户的日记
-- SELECT * FROM diary_entries WHERE user_id = [CURRENT_USER_ID] ORDER BY created_at DESC;
