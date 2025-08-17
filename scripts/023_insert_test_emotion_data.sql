-- 插入测试的情绪分析数据
-- 用于测试情绪评分仪表盘功能

-- 1. 为现有日记记录添加情绪分析数据
UPDATE diary_entries 
SET 
    mood_score = CASE 
        WHEN emotion LIKE '%快乐%' OR emotion LIKE '%开心%' OR emotion LIKE '%兴奋%' THEN 9
        WHEN emotion LIKE '%满足%' OR emotion LIKE '%感激%' OR emotion LIKE '%希望%' THEN 8
        WHEN emotion LIKE '%好奇%' OR emotion LIKE '%专注%' THEN 7
        WHEN emotion LIKE '%平静%' THEN 6
        WHEN emotion LIKE '%疲惫%' THEN 4
        WHEN emotion LIKE '%焦虑%' OR emotion LIKE '%困惑%' THEN 3
        WHEN emotion LIKE '%沮丧%' OR emotion LIKE '%孤独%' THEN 2
        WHEN emotion LIKE '%愤怒%' OR emotion LIKE '%压力%' THEN 1
        ELSE 5
    END,
    emotion_keywords = CASE 
        WHEN emotion LIKE '%快乐%' THEN ARRAY['开心', '兴奋', '满足', '幸福']
        WHEN emotion LIKE '%平静%' THEN ARRAY['宁静', '放松', '平和', '安详']
        WHEN emotion LIKE '%疲惫%' THEN ARRAY['劳累', '困倦', '无力', '需要休息']
        WHEN emotion LIKE '%焦虑%' THEN ARRAY['担心', '紧张', '不安', '忧虑']
        WHEN emotion LIKE '%沮丧%' THEN ARRAY['失落', '失望', '难过', '消沉']
        ELSE ARRAY['一般', '普通', '日常']
    END,
    event_keywords = CASE 
        WHEN content LIKE '%工作%' THEN ARRAY['工作', '项目', '会议']
        WHEN content LIKE '%学习%' THEN ARRAY['学习', '读书', '课程']
        WHEN content LIKE '%运动%' THEN ARRAY['运动', '健身', '跑步']
        WHEN content LIKE '%朋友%' THEN ARRAY['朋友', '聚会', '聊天']
        WHEN content LIKE '%家人%' THEN ARRAY['家人', '家庭', '亲情']
        ELSE ARRAY['日常', '生活', '记录']
    END,
    ai_analysis_updated_at = NOW()
WHERE mood_score IS NULL OR mood_score = 5;

-- 2. 插入7天的完整测试数据
INSERT INTO diary_entries (
    user_id, 
    title, 
    content, 
    emotion, 
    mood_score, 
    emotion_keywords, 
    event_keywords, 
    ai_insight,
    created_at, 
    updated_at, 
    ai_analysis_updated_at
) VALUES 
-- 用户1的7天完整测试数据
(1, '收到录取通知的喜悦', '今天收到了心仪大学的录取通知，多年的努力终于有了回报！感觉人生达到了一个新的高度，所有的付出都值得了。', '快乐', 10, ARRAY['成功了', '值了', '人生巅峰', '开心到语无伦次', '燃起来', '太爽了'], ARRAY['收到录取通知', '多年的努力', '人生里程碑'], '这是一个重要的里程碑，你的努力得到了回报！继续保持这种积极向上的心态。', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

(1, '项目完成的满足感', '经过一个月的努力，项目终于完成了，团队合作很愉快。虽然过程中遇到了一些困难，但最终都克服了。', '满足', 8, ARRAY['成就感', '满足', '团队合作', '项目完成', '克服困难'], ARRAY['项目完成', '团队合作', '一个月努力', '克服困难'], '项目成功完成体现了你的专业能力和团队协作精神。困难是成长的机会。', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

(1, '平静的午后时光', '下午在咖啡厅看书，阳光透过窗户洒在书页上，很宁静。享受这种独处的时光，内心很平静。', '平静', 6, ARRAY['宁静', '放松', '享受', '阅读时光', '独处'], ARRAY['咖啡厅', '看书', '午后阳光', '独处时光'], '这样的宁静时光是生活中难得的享受，有助于内心平静和思考。', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

(1, '工作压力有点大', '今天工作很多，deadline很紧，感觉有点压力。需要合理安排时间，提高工作效率。', '压力', 3, ARRAY['压力', '紧张', '忙碌', 'deadline', '时间管理'], ARRAY['工作', 'deadline', '项目', '时间管理'], '适当的压力可以促进效率，记得合理安排时间，保持工作生活平衡。', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

(1, '和朋友聚会的快乐', '晚上和朋友一起吃饭聊天，很开心，感觉心情好多了。社交活动真的很重要，能让人心情愉悦。', '快乐', 8, ARRAY['开心', '友谊', '放松', '快乐时光', '社交'], ARRAY['朋友聚会', '吃饭聊天', '社交活动'], '与朋友相处是缓解压力的好方式，保持社交联系很重要。', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

(1, '学习新技能的兴奋', '今天学会了新的编程技能，感觉很有成就感！技术学习让人充满动力。', '兴奋', 9, ARRAY['兴奋', '成就感', '学习', '进步', '技术'], ARRAY['学习技能', '编程', '成就感', '技术提升'], '持续学习是个人成长的重要途径，技术能力提升让人更有自信。', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

(1, '今天心情不错', '今天天气很好，心情也不错，准备开始新的一天。保持积极的心态很重要。', '满足', 7, ARRAY['好心情', '积极', '新开始', '美好', '阳光'], ARRAY['好天气', '新的一天', '积极心态', '阳光'], '保持积极的心态是美好生活的基础，每一天都是新的开始。', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

(1, '运动后的疲惫', '今天去健身房锻炼了两个小时，现在感觉很累但很满足。运动让人身心愉悦。', '疲惫', 4, ARRAY['疲惫', '满足', '运动', '健康', '锻炼'], ARRAY['健身房', '锻炼', '两小时', '健康'], '运动后的疲惫是健康的标志，记得适当休息，保持运动习惯。', NOW(), NOW(), NOW()),

-- 用户2的测试数据（如果有其他用户）
(2, '学习新技能的兴奋', '今天学会了新的编程技能，感觉很有成就感！', '兴奋', 9, ARRAY['兴奋', '成就感', '学习', '进步'], ARRAY['学习技能', '编程', '成就感'], '持续学习是个人成长的重要途径，继续保持！', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

(2, '运动后的疲惫', '今天去健身房锻炼了两个小时，现在感觉很累但很满足。', '疲惫', 4, ARRAY['疲惫', '满足', '运动', '健康'], ARRAY['健身房', '锻炼', '两小时'], '运动后的疲惫是健康的标志，记得适当休息。', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- 3. 验证数据插入
SELECT 
    id,
    title,
    mood_score,
    emotion_keywords,
    event_keywords,
    created_at::date as date,
    ai_analysis_updated_at
FROM diary_entries 
WHERE mood_score IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 15;

-- 4. 检查数据分布
SELECT 
    mood_score,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM diary_entries), 2) as percentage
FROM diary_entries 
WHERE mood_score IS NOT NULL
GROUP BY mood_score 
ORDER BY mood_score;

-- 5. 检查最近7天的数据
SELECT 
    created_at::date as date,
    COUNT(*) as records,
    AVG(mood_score) as avg_mood,
    array_agg(DISTINCT title) as titles
FROM diary_entries 
WHERE mood_score IS NOT NULL 
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY created_at::date
ORDER BY date;
