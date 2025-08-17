-- 为conversations表添加ai_insight字段
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_insight TEXT;

-- 为conversations表添加ai_insight的索引
CREATE INDEX IF NOT EXISTS idx_conversations_ai_insight ON conversations(ai_insight) WHERE ai_insight IS NOT NULL;

-- 更新现有记录的ai_insight字段（如果有的话）
-- 这里可以为空，因为新功能会逐步填充
