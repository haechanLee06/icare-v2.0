# Profile页面重构指南

## 概述

本次重构将profile页面从上传头像改为从头像库选择头像，并简化了用户信息字段，只保留基本信息（用户名、生日）和写作偏好。

## 主要变更

### 1. 头像系统重构

**之前**：用户上传自定义头像到Supabase Storage
**现在**：用户从预设的6个头像中选择

#### 头像库配置
- 位置：`lib/avatar-library.ts`
- 包含6个预设头像：
  - `avatar_001` - 温暖阳光
  - `avatar_002` - 宁静月光
  - `avatar_003` - 活力火焰
  - `avatar_004` - 智慧星辰
  - `avatar_005` - 自然清风
  - `avatar_006` - 梦幻彩虹

#### 数据库字段变更
- 删除：`avatar_url` (VARCHAR)
- 新增：`avatar_id` (VARCHAR(50)) - 存储选择的头像ID

### 2. 用户信息字段简化

**保留字段**：
- `username` - 用户名
- `birthday` - 生日
- `writing_style` - 写作风格
- `diary_length` - 日记长度
- `avatar_id` - 头像ID

**删除字段**：
- `nickname` - 昵称
- `signature` - 个性签名
- `gender` - 性别
- `personality_tags` - 个性标签
- `reminder_enabled` - 提醒开关
- `daily_reminder` - 每日提醒
- `weekly_review` - 周回顾

### 3. UI界面更新

#### 头像选择器
- 点击头像下方的箭头按钮展开选择器
- 3x2网格布局显示所有头像选项
- 当前选中的头像有高亮边框和勾选标记
- 显示头像名称和描述

#### 表单简化
- 基本信息：只保留用户名和生日
- 写作偏好：保留写作风格和日记长度设置
- 删除所有开关和标签选择

## 文件变更

### 新增文件
- `lib/avatar-library.ts` - 头像库配置
- `scripts/015_update_profile_structure.sql` - 数据库结构更新脚本
- `public/avatars/README.md` - 头像文件夹说明

### 修改文件
- `app/profile/page.tsx` - 重构后的profile页面
- `app/page.tsx` - 更新头像显示逻辑

## 实施步骤

### 步骤1：更新数据库结构
在Supabase SQL编辑器中运行：
```sql
\i scripts/015_update_profile_structure.sql
```

### 步骤2：上传头像图片
将6个头像图片放入 `public/avatars/` 文件夹：
- `avatar_001.png`
- `avatar_002.png`
- `avatar_003.png`
- `avatar_004.png`
- `avatar_005.png`
- `avatar_006.png`

### 步骤3：测试功能
1. 登录用户账号
2. 进入个人资料页面
3. 测试头像选择功能
4. 测试基本信息编辑
5. 测试写作偏好设置
6. 确认保存功能正常

## 技术实现细节

### 头像选择逻辑
```typescript
const handleAvatarSelect = (avatarId: string) => {
  setSelectedAvatarId(avatarId)
  setIsAvatarSelectorOpen(false)
}

const getCurrentAvatar = (): AvatarOption => {
  return getAvatarById(selectedAvatarId) || avatarLibrary[0]
}
```

### 数据库更新
```typescript
const { error } = await supabase
  .from('users')
  .update({
    username: username,
    birthday: birthday,
    writing_style: writingStyle,
    diary_length: diaryLength[0],
    avatar_id: selectedAvatarId,
    updated_at: new Date().toISOString()
  })
  .eq('id', user.id)
```

### 头像显示
```typescript
<AvatarImage src={getCurrentAvatar().url} />
```

## 优势

1. **简化用户体验**：无需上传文件，直接选择预设头像
2. **减少存储成本**：不需要Supabase Storage存储用户头像
3. **统一设计风格**：所有头像保持一致的视觉风格
4. **提高性能**：静态资源加载更快
5. **简化维护**：不需要处理文件上传和存储权限

## 注意事项

1. **头像图片**：确保图片质量良好，尺寸统一
2. **文件命名**：严格按照配置中的文件名命名
3. **数据库备份**：执行数据库更新前建议备份数据
4. **兼容性**：新用户自动使用默认头像 `avatar_001`

## 后续优化建议

1. **头像分类**：可以按主题或风格对头像进行分类
2. **个性化**：允许用户调整头像颜色或添加装饰
3. **节日主题**：在特殊节日提供主题头像
4. **用户贡献**：允许用户提交自定义头像设计

