-- 修复密码hash问题
-- 问题：数据库中的密码已经是hash值，但登录时又计算hash，导致双重hash

-- 1. 首先查看当前用户密码状态
SELECT id, username, password_hash, LENGTH(password_hash) as hash_length FROM users;

-- 2. 将现有的hash值转换为明文密码（假设原始密码都是简单的测试密码）
-- 注意：这里我们假设原始密码，实际使用时应该让用户重新设置密码

-- 方法1：重置所有用户密码为默认值
UPDATE users 
SET password_hash = '5d41402abc4b2a76b9719d911017c592' -- 'hello' 的MD5 hash
WHERE username = 'demo_user';

-- 方法2：如果你想设置不同的默认密码，可以修改这里
-- UPDATE users 
-- SET password_hash = '098f6bcd4621d373cade4e832627b4f6' -- 'test' 的MD5 hash
-- WHERE username = 'demo_user';

-- 3. 验证修复结果
SELECT id, username, password_hash, LENGTH(password_hash) as hash_length FROM users;

-- 4. 测试登录（可选）
-- 现在用户可以使用以下凭据登录：
-- 用户名: demo_user
-- 密码: hello

