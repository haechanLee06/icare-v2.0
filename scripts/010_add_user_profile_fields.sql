-- 添加用户资料相关字段
-- 这个脚本将为users表添加个人资料相关的字段

-- 1. 检查当前表结构
SELECT 'Current users table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. 添加用户资料字段（如果不存在）
DO $$
BEGIN
    -- 添加昵称字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nickname') THEN
        ALTER TABLE users ADD COLUMN nickname VARCHAR(100);
        RAISE NOTICE 'Added nickname column';
    ELSE
        RAISE NOTICE 'nickname column already exists';
    END IF;

    -- 添加个性签名字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'signature') THEN
        ALTER TABLE users ADD COLUMN signature TEXT;
        RAISE NOTICE 'Added signature column';
    ELSE
        RAISE NOTICE 'signature column already exists';
    END IF;

    -- 添加生日字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'birthday') THEN
        ALTER TABLE users ADD COLUMN birthday DATE;
        RAISE NOTICE 'Added birthday column';
    ELSE
        RAISE NOTICE 'birthday column already exists';
    END IF;

    -- 添加性别字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gender') THEN
        ALTER TABLE users ADD COLUMN gender VARCHAR(20);
        RAISE NOTICE 'Added gender column';
    ELSE
        RAISE NOTICE 'gender column already exists';
    END IF;

    -- 添加个性标签字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'personality_tags') THEN
        ALTER TABLE users ADD COLUMN personality_tags TEXT[];
        RAISE NOTICE 'Added personality_tags column';
    ELSE
        RAISE NOTICE 'personality_tags column already exists';
    END IF;

    -- 添加写作风格字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'writing_style') THEN
        ALTER TABLE users ADD COLUMN writing_style VARCHAR(50);
        RAISE NOTICE 'Added writing_style column';
    ELSE
        RAISE NOTICE 'writing_style column already exists';
    END IF;

    -- 添加日记长度字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'diary_length') THEN
        ALTER TABLE users ADD COLUMN diary_length INTEGER DEFAULT 3;
        RAISE NOTICE 'Added diary_length column';
    ELSE
        RAISE NOTICE 'diary_length column already exists';
    END IF;

    -- 添加头像URL字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column';
    ELSE
        RAISE NOTICE 'avatar_url column already exists';
    END IF;

    -- 添加更新时间字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- 3. 创建头像存储桶（如果不存在）
-- 注意：这需要在Supabase Dashboard中手动创建，或者使用Storage API

-- 4. 更新现有用户的默认值
UPDATE users 
SET 
    nickname = COALESCE(nickname, username),
    signature = COALESCE(signature, '用文字记录内心的小确幸，让每一次情绪波动都成为成长的轨迹。'),
    personality_tags = COALESCE(personality_tags, ARRAY['平静', '内省', '文艺']),
    writing_style = COALESCE(writing_style, '温柔'),
    diary_length = COALESCE(diary_length, 3)
WHERE nickname IS NULL OR signature IS NULL OR personality_tags IS NULL OR writing_style IS NULL OR diary_length IS NULL;

-- 5. 显示更新后的表结构
SELECT 'Updated users table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 6. 显示用户资料统计
SELECT 'User profile statistics:' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(nickname) as users_with_nickname,
    COUNT(signature) as users_with_signature,
    COUNT(avatar_url) as users_with_avatar,
    COUNT(personality_tags) as users_with_tags
FROM users;

-- 7. 显示示例用户资料
SELECT 'Sample user profiles:' as info;
SELECT 
    id,
    username,
    nickname,
    LEFT(signature, 50) || '...' as signature_preview,
    personality_tags,
    writing_style,
    diary_length,
    avatar_url IS NOT NULL as has_avatar
FROM users
LIMIT 5;


