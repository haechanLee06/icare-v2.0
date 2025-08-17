-- 添加情绪分析字段到diary_entries表
-- 用于存储AI分析的情绪评分、关键词等数据

-- 1. 添加情绪分析字段
ALTER TABLE diary_entries 
ADD COLUMN IF NOT EXISTS mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
ADD COLUMN IF NOT EXISTS emotion_keywords TEXT[],
ADD COLUMN IF NOT EXISTS event_keywords TEXT[],
ADD COLUMN IF NOT EXISTS ai_analysis_updated_at TIMESTAMP WITH TIME ZONE;

-- 2. 为现有记录设置默认值
UPDATE diary_entries 
SET 
    mood_score = COALESCE(mood_score, 5),
    emotion_keywords = COALESCE(emotion_keywords, ARRAY[]::TEXT[]),
    event_keywords = COALESCE(event_keywords, ARRAY[]::TEXT[]),
    ai_analysis_updated_at = COALESCE(ai_analysis_updated_at, updated_at)
WHERE mood_score IS NULL;

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_diary_entries_mood_score ON diary_entries(mood_score);
CREATE INDEX IF NOT EXISTS idx_diary_entries_ai_analysis_updated_at ON diary_entries(ai_analysis_updated_at);

-- 4. 验证表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diary_entries' 
AND column_name IN ('mood_score', 'emotion_keywords', 'event_keywords', 'ai_analysis_updated_at')
ORDER BY ordinal_position;

-- 5. 检查约束
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%mood_score%';
