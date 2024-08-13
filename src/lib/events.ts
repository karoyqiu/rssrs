/**
 * 文章未读事件
 */
export type ArticleReadEvent = { id: number; unread: boolean };

/**
 * 种子未读数量事件
 */
export type SeedUnreadCountEvent = { id: number | null; unreadCount: number };
