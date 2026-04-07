-- 0004: 为 posts 表添加 pinned 和 publish_at 字段
-- pinned: 文章置顶功能
-- publish_at: 定时发布功能

ALTER TABLE posts ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN publish_at TEXT;
