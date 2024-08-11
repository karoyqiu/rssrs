/**
 * 种子项未读事件
 */
export type SeedItemReadEvent = { id: number; unread: boolean };

/**
 * 种子未读数量事件
 */
export type SeedUnreadCountEvent = { id: number | null; unreadCount: number };
