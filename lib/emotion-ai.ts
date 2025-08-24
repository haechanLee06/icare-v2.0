import { supabase } from '@/lib/supabase/client'

export interface EmotionAnalysisResult {
  mood_score: number
  emotion_keywords: string[]
  event_keywords: string[]
}

/**
 * 使用AI分析日记内容的情绪
 * @param title 日记标题
 * @param content 日记内容
 * @param emotion 用户选择的情绪标签
 * @returns 情绪分析结果
 */
export async function analyzeEmotionWithAI(
  title: string,
  content: string,
  emotion: string
): Promise<EmotionAnalysisResult | null> {
  try {
    // 构建AI分析提示词
    const prompt = `
# 角色
你是一个专业的情绪分析师和文本信息提取专家。

# 任务
你的任务是基于用户提供的文本记录，进行深入的情绪分析，并以严格的 JSON 格式输出三个关键信息：心情指数、心情关键词和事件关键词。

# 指令与规则
1.  **心情指数 (mood_score)**:
    * 对文本中表达的整体情绪强度进行评分，分值为 1-10 的整数。
    * 评分标准：1 代表极度负面情绪（如：绝望、崩溃），5 代表中性或复杂情绪（如：平静、迷茫、悲喜交加），10 代表极度正面情绪（如：狂喜、极度兴奋）。
    * 评分必须是整数。

2.  **心情关键词 (emotion_keywords)**:
    * 从文本中提取能直接或间接描述情绪状态的词语或短语。
    * 这些词应该聚焦于“感受”，例如“开心”、“崩溃”、“燃起来”、“心如刀割”、“松了一口气”等。
    * 结果必须是一个 JSON 字符串数组。

3.  **事件关键词 (event_keywords)**:
    * 从文本中提取引发上述情绪的客观“事件”、“原因”或“对象”。
    * 这些词应该聚焦于“事实”，即“发生了什么事”，例如“收到录取通知书”、“项目搞砸了”、“和朋友吵架”、“考试通过”等。
    * 结果必须是一个 JSON 字符串数组。

4.  **输出格式**:
    * 你必须且只能输出一个严格的、不包含任何额外解释说明的 JSON 对象。
    * JSON 对象的键必须使用英文："mood_score", "emotion_keywords", "event_keywords"。

输出格式示例：
{
  "mood_score": 0,
  "emotion_keywords": [],
  "event_keywords": []
}

相应心情指数示例：
输入：感觉自己已经到极限了，真的撑不住了。脑子里一团乱麻，什么都完了。做什么都没有意义，吃饭、睡觉都像是在完成任务。躺在床上一动不动，但心脏跳得飞快，那种恐慌和绝望的感觉快把我吞没了。整个人就像行尸走肉，看不到任何希望，也不知道明天该怎么办。可能，就这样吧。
输出:
emotion_value：0/10
emotion_key words:恐慌、绝望、行尸走肉
event_keywords：/
### ****
**常用关键词：**
绝望, 崩溃, 行尸走肉, 毫无希望, **万念俱灰, 生不如死, 世界末日, 想离开这个世界, 精神崩溃, 彻底完了**
**日记文本（参考）：**

### **心情分数：1/10**
**常用关键词：**
痛苦, 难过, 伤心, 心如刀割, **心碎, 悲痛, 煎熬, 痛不欲生, 以泪洗面, 肝肠寸断**
**日记文本（参考）：**
今天还是很难过。不知道自己哭了多久，眼睛又肿又痛。心里堵得慌，像被刀割一样。什么都不想干，饭也吃不下。朋友发消息安慰我，看了两眼就关掉了，现在实在没力气回复任何人。一闲下来，那些不开心的事就一遍遍地在脑子里过，真的太痛苦了。

### **心情分数：2/10**
**常用关键词：**
压抑, 郁闷, 心烦, 不开心, **烦躁, 憋屈, 情绪低落, 闷闷不乐, 闹心, 提不起劲**
**日记文本（参考）：**
今天一整天都很郁闷。上班的时候，老板说了几句，同事也让人心烦。感觉一股火憋在心里，上不去也下不来，特别压抑。回到家，看到乱糟糟的房间，更烦了。就是那种说不出来为什么，但就是不开心。想找人聊聊，又觉得这点事没什么好说的。

### **心情分数：3/10**
**常用关键词：**
麻木, 没劲, 无聊, 混日子, **没意思, 空虚, 迷茫, 佛系, 躺平, 漫无目的**
**日记文本（参考）：**
今天过得没什么感觉，有点麻木。工作就那样，不好不坏。下班后也不知道干嘛，就躺在沙发上漫无目的地刷手机，一个接一个的短视频，看完就忘了。感觉时间就这么流走了，挺没劲的。说不上难过，但也完全开心不起来，感觉就是在混日子。

### **心情分数：4/10**
**常用关键词：**
失落, 失望, 心情不好, 不爽, **扫兴, 有点丧, emo了, 低落, 徒劳, 无语**
**日记文本（参考）：**
本来挺期待今天的一个活动，结果临时被取消了，瞬间感觉很失落。虽然不是什么大事，但心情一下就不好了。一整天都感觉有点不爽，做什么事都提不起精神。计划被打乱的感觉真的很糟糕，今天一天的好心情都被这件事毁了。

### **心情分数：5/10**
**常用关键词：**
平静, 一般, 还行, 无事发生, **就那样, 没什么感觉, 一切照旧, 无风无浪, 波澜不惊, 正常**
**日记文本（参考）：**
很普通的一天。早上按时起床，上班，处理工作，下班，回家吃饭。没什么特别的事情发生，一切都按部就班。心情也一样，很平静，不好也不坏。就感觉，嗯，今天也过去了。还行吧。

### **心情分数：6/10**
**常用关键词：**
放松, 还不错, 心情转好, 有点意思, **惬意, 舒坦, 安心, 被治愈了, 还可以, 舒心**
**日记文本（参考）：**
今天下午总算忙完了手头最麻烦的一个活儿，整个人都放松下来了。下班后去楼下公园走了走，天气还不错，吹吹风感觉舒服多了。之前烦心的事情解决了，心情也跟着转好了。晚上看了个挺有意思的电影，感觉今天过得还不错。

### **心情分数：7/10**
**常用关键词：**
开心, 高兴, 愉快, 心情不错, **快乐, 满足, 美滋滋, 心情很好, 嘴角上扬, 乐呵**
**日记文本（参考）：**
今天挺开心的。中午跟同事一起吃了顿大餐，聊了很多八卦，特别搞笑。下午工作效率也很高，准时下班。晚上约了朋友一起打游戏，赢了好几局。是挺简单平常的一天，但整个过程都很愉快，感觉心情不错。

### **心情分数：8/10**
**常用关键词：**
兴奋, 激动, 很有成就感, 棒极了, **惊喜, 振奋, 充满期待, 太赞了, 超开心, 值得**
**日记文本（参考）：**
太激动了！我负责的那个项目今天得到了领导的公开表扬，还拿到了奖金！之前加了那么多班，总算没白费。那种努力得到回报的感觉真的太棒了，非常有成就感！现在还有点兴奋，已经约好同事们周末去庆祝了！

### **心情分数：9/10**
**常用关键词：**
幸福, 美好, 温暖, 感动, **暖心, 陶醉, 充实, 感恩, 心满意足, 爱了爱了**
**日记文本（参考）：**
今天真的感觉特别幸福。晚上回家，家人给我准备了惊喜，庆祝我的生日。虽然不是什么贵重的礼物，但看到他们为我忙碌的样子，心里感觉特别温暖。我们坐在一起吃饭聊天，感觉生活真的很美好。被人在乎的感觉，真的会很感动。

### **心情分数：10/10**
**常用关键词：**
狂喜, 爽, 燃, 人生巅峰, **爽翻了, 嗨到不行, 飘了, 太顶了, 炸裂, 无敌**
**日记文本（参考）：**
啊啊啊我成功了！收到录取通知的那一刻，我直接跳了起来！感觉这么多年的努力在这一刻全部都值了！简直是人生巅峰！现在开心到语无伦次，感觉整个人都“燃”起来了，浑身都是用不完的劲儿！这种感觉真的太爽了！`

    // 调用AI接口进行分析
    const response = await fetch('/api/ai/analyze-emotion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        title,
        content,
        emotion
      })
    })

    if (!response.ok) {
      throw new Error(`AI分析请求失败: ${response.status}`)
    }

    const result = await response.json()
    
    // 验证返回的数据格式
    if (!result.mood_score || !result.emotion_keywords || !result.event_keywords) {
      throw new Error('AI返回的数据格式不正确')
    }

    // 确保mood_score在1-10范围内
    const moodScore = Math.max(1, Math.min(10, Math.round(result.mood_score)))
    
    // 确保关键词数组长度正确
    const emotionKeywords = Array.isArray(result.emotion_keywords) 
      ? result.emotion_keywords.slice(0, 6) 
      : []
    const eventKeywords = Array.isArray(result.event_keywords) 
      ? result.event_keywords.slice(0, 2) 
      : []

    return {
      mood_score: moodScore,
      emotion_keywords: emotionKeywords,
      event_keywords: eventKeywords
    }

  } catch (error) {
    console.error('AI情绪分析失败:', error)
    return null
  }
}

/**
 * 保存情绪分析结果到数据库
 * @param diaryId 日记ID
 * @param userId 用户ID
 * @param analysisResult 分析结果
 * @returns 是否保存成功
 */
export async function saveEmotionAnalysis(
  diaryId: number,
  userId: number,
  analysisResult: EmotionAnalysisResult
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('diary_entries')
      .update({
        mood_score: analysisResult.mood_score,
        emotion_keywords: analysisResult.emotion_keywords,
        event_keywords: analysisResult.event_keywords,
        ai_analysis_updated_at: new Date().toISOString()
      })
      .eq('id', diaryId)
      .eq('user_id', userId)

    if (error) {
      console.error('保存情绪分析结果失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('保存情绪分析结果异常:', error)
    return false
  }
}
