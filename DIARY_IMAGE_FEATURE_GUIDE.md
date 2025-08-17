# 日记图片功能使用指南

## 概述

本次更新为日记编辑页面添加了图片上传功能，用户可以在编辑日记时添加图片，图片会显示在日记内容下方。

## 新增功能

### 1. 图片上传
- 点击"添加照片"工具按钮
- 支持常见图片格式：JPEG、PNG、GIF、WebP、SVG
- 文件大小限制：5MB
- 图片自动存储到Supabase Storage

### 2. 图片管理
- 图片以3x3网格形式显示
- 悬停显示删除按钮
- 支持删除已上传的图片
- 图片按上传时间排序

### 3. 数据存储
- 图片文件存储在 `diary-images` bucket中
- 图片信息存储在 `diary_images` 表中
- 支持行级安全策略(RLS)
- 自动清理关联数据

## 数据库结构

### diary_images表
```sql
CREATE TABLE diary_images (
    id UUID PRIMARY KEY,
    diary_id INTEGER REFERENCES diary_entries(id),
    user_id INTEGER REFERENCES users(id),
    filename VARCHAR(255),
    url TEXT,
    file_path TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**注意**：`diary_id` 和 `user_id` 使用 `INTEGER` 类型，与现有表的 `SERIAL` 主键类型匹配。

### 存储结构
```
diary-images/
├── user_id_1/
│   ├── diary_id_1/
│   │   ├── timestamp_random1.jpg
│   │   └── timestamp_random2.png
│   └── diary_id_2/
│       └── timestamp_random3.gif
└── user_id_2/
    └── diary_id_3/
        └── timestamp_random4.webp
```

## 实施步骤

### 步骤1：运行数据库脚本
在Supabase SQL编辑器中依次运行：

1. **创建图片表（修复版本）**：
   ```sql
   \i scripts/018_fix_diary_images_types.sql
   ```
   
   **重要**：如果之前运行过有问题的脚本，请使用这个修复版本。

2. **设置存储bucket**：
   ```sql
   \i scripts/017_setup_diary_images_storage.sql
   ```

### 步骤2：验证设置
运行修复脚本后，会自动验证：
- `diary_images` 表结构
- 外键约束
- RLS策略
- 相关表的ID字段类型

### 步骤3：测试功能
1. 进入日记编辑页面
2. 点击"添加照片"按钮
3. 选择图片文件上传
4. 查看图片是否正确显示
5. 测试删除图片功能

## 常见问题解决

### 外键类型错误
如果遇到以下错误：
```
ERROR: 42804: foreign key constraint "diary_images_diary_id_fkey" cannot be implemented
DETAIL: Key columns "diary_id" and "id" are of incompatible types: uuid and integer.
```

**解决方案**：
1. 使用修复脚本 `scripts/018_fix_diary_images_types.sql`
2. 该脚本会删除有问题的表并重新创建
3. 确保使用正确的数据类型（INTEGER 而不是 UUID）

### 数据类型说明
- `diary_entries.id`: SERIAL (INTEGER)
- `users.id`: SERIAL (INTEGER)  
- `diary_images.diary_id`: INTEGER
- `diary_images.user_id`: INTEGER
- `diary_images.id`: UUID (图片记录的唯一标识)

## 技术实现

### 前端组件
- `EditDiaryPage` - 日记编辑页面
- 图片上传处理函数
- 图片展示和删除组件
- 文件输入引用

### 后端API
- Supabase Storage API
- 数据库CRUD操作
- 文件路径管理
- 错误处理

### 安全特性
- 用户身份验证
- 行级安全策略
- 文件类型验证
- 文件大小限制
- 用户数据隔离

## 使用说明

### 上传图片
1. 在日记编辑页面，点击"添加照片"工具按钮
2. 选择要上传的图片文件
3. 等待上传完成
4. 图片会自动显示在日记内容下方

### 管理图片
- **查看图片**：图片以缩略图形式显示
- **删除图片**：悬停在图片上，点击右上角的X按钮
- **图片排序**：按上传时间自动排序

### 注意事项
- 只支持图片文件格式
- 单个文件不能超过5MB
- 图片会永久存储，删除日记时图片也会被删除
- 建议使用压缩后的图片以提高加载速度

## 故障排除

### 常见问题

1. **上传失败**
   - 检查文件格式是否正确
   - 确认文件大小不超过5MB
   - 验证网络连接

2. **图片不显示**
   - 检查Storage bucket是否正确创建
   - 验证RLS策略是否生效
   - 查看浏览器控制台错误信息

3. **权限错误**
   - 确认用户已登录
   - 检查用户ID是否匹配
   - 验证数据库策略设置

4. **外键约束错误**
   - 使用修复脚本重新创建表
   - 确保数据类型匹配
   - 检查相关表的结构

### 调试信息
- 查看浏览器控制台日志
- 检查Supabase Dashboard中的错误日志
- 验证数据库表结构和策略
- 运行验证查询检查数据类型

## 后续优化建议

1. **图片压缩**：自动压缩上传的图片
2. **批量上传**：支持一次选择多张图片
3. **图片编辑**：添加简单的图片编辑功能
4. **缩略图生成**：自动生成不同尺寸的缩略图
5. **图片分类**：按类型或标签组织图片
6. **搜索功能**：在图片中搜索特定内容

## 总结

日记图片功能为用户提供了更丰富的日记记录方式，通过图片可以更好地记录和回忆生活中的美好瞬间。该功能具有完善的安全机制和用户友好的界面，为用户提供了良好的使用体验。

**重要提醒**：如果遇到数据类型不匹配的问题，请使用修复脚本 `scripts/018_fix_diary_images_types.sql` 来解决。
