# 数据库更新说明

## 概述
为了优化项目并使其使用真实数据而不是预设数据，我们需要更新数据库结构。

## 更新步骤

### 1. 执行数据库更新脚本
在您的 Supabase 项目中执行以下 SQL 脚本：

```sql
-- 执行 scripts/006_update_database_structure.sql 中的内容
```

### 2. 手动执行 SQL 命令
如果您无法直接执行脚本文件，请手动执行以下 SQL 命令：

#### 更新日记条目表
```sql
ALTER TABLE IF EXISTS diary_entries 
ADD COLUMN IF NOT EXISTS conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS mood_tags TEXT[],
ADD COLUMN IF NOT EXISTS weather VARCHAR(100),
ADD COLUMN IF NOT EXISTS location VARCHAR(200),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
```

#### 更新消息表
```sql
ALTER TABLE IF EXISTS messages 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
```

#### 创建用户设置表
```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
  language VARCHAR(10) DEFAULT 'zh-CN',
  theme VARCHAR(20) DEFAULT 'system',
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 创建情绪标签表
```sql
CREATE TABLE IF NOT EXISTS emotion_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50),
  color VARCHAR(20),
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 插入默认情绪标签
```sql
INSERT INTO emotion_tags (name, category, color, emoji) VALUES
('开心', 'positive', 'bg-green-100 text-green-800', '😊'),
('平静', 'neutral', 'bg-blue-100 text-blue-800', '😌'),
('感动', 'positive', 'bg-pink-100 text-pink-800', '🥰'),
('期待', 'positive', 'bg-yellow-100 text-yellow-800', '🤗'),
('释然', 'positive', 'bg-purple-100 text-purple-800', '😌'),
('自豪', 'positive', 'bg-orange-100 text-orange-800', '😎'),
('温暖', 'positive', 'bg-red-100 text-red-800', '🤗'),
('充实', 'positive', 'bg-indigo-100 text-indigo-800', '😊'),
('感恩', 'positive', 'bg-teal-100 text-teal-800', '🙏'),
('希望', 'positive', 'bg-emerald-100 text-emerald-800', '✨'),
('难过', 'negative', 'bg-gray-100 text-gray-800', '😢'),
('焦虑', 'negative', 'bg-yellow-100 text-yellow-800', '😰'),
('愤怒', 'negative', 'bg-red-100 text-red-800', '😠'),
('困惑', 'neutral', 'bg-gray-100 text-gray-800', '🤔'),
('疲惫', 'negative', 'bg-gray-100 text-gray-800', '😴'),
('孤独', 'negative', 'bg-gray-100 text-gray-800', '😔'),
('压力', 'negative', 'bg-gray-100 text-gray-800', '😤'),
('羞愧', 'negative', 'bg-gray-100 text-gray-800', '😳'),
('惊喜', 'positive', 'bg-yellow-100 text-yellow-800', '😲')
ON CONFLICT (name) DO NOTHING;
```

#### 创建索引
```sql
CREATE INDEX IF NOT EXISTS idx_diary_entries_conversation_id ON diary_entries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_tags_category ON emotion_tags(category);
```

#### 添加触发器
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diary_entries_updated_at 
    BEFORE UPDATE ON diary_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 更新后的功能

### 1. 动态日期显示
- 所有日期现在都使用当前真实日期
- 支持相对时间显示（今天、昨天、X天前等）
- 月份导航可以切换查看不同月份的日记

### 2. 真实数据集成
- 日记内容从数据库动态加载
- 情绪标签使用数据库中的配置
- AI 洞察基于实际对话内容生成

### 3. 增强的数据结构
- 支持天气、位置等额外信息
- 情绪标签数组支持多个标签
- 关联对话记录，便于追踪日记来源

## 注意事项
- 执行更新脚本前请备份数据库
- 新字段都有默认值，不会影响现有数据
- 如果遇到权限问题，请确保有足够的数据库权限
