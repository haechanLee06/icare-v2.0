-- 插入初始用户数据（用于测试）
INSERT INTO users (username, password_hash, email) VALUES 
('demo_user', '5d41402abc4b2a76b9719d911017c592', 'demo@example.com') -- password: hello
ON CONFLICT (username) DO NOTHING;

-- 插入初始日记数据
INSERT INTO diary_entries (user_id, title, content, emotion, ai_insight) VALUES 
(1, '今天的心情', '今天感觉很不错，阳光明媚，心情也跟着好起来了。', '平静', 'AI分析：从你的描述中可以感受到积极的情绪，阳光和好天气确实能够影响我们的心情。')
ON CONFLICT DO NOTHING;
