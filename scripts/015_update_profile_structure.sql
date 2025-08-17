-- 更新用户资料表结构
-- 删除不需要的字段，添加avatar_id字段，简化表结构

-- 1. 添加avatar_id字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_id VARCHAR(50) DEFAULT 'avatar_001';

-- 2. 删除不需要的字段（如果存在）
ALTER TABLE users DROP COLUMN IF EXISTS nickname;
ALTER TABLE users DROP COLUMN IF EXISTS signature;
ALTER TABLE users DROP COLUMN IF EXISTS gender;
ALTER TABLE users DROP COLUMN IF EXISTS personality_tags;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;

-- 3. 确保保留的字段存在
-- username, birthday, writing_style, diary_length, avatar_id, created_at, updated_at

-- 4. 验证表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. 更新现有用户的avatar_id为默认值（如果为NULL）
UPDATE users 
SET avatar_id = 'avatar_001' 
WHERE avatar_id IS NULL;

-- 6. 验证数据
SELECT 
    id,
    username,
    birthday,
    writing_style,
    diary_length,
    avatar_id,
    created_at,
    updated_at
FROM users
LIMIT 5;

