/**
 * 种子项未读事件
 */
export type SeedItemReadEvent = { id: string; unread: boolean };

/**
 * 种子未读数量事件
 */
export type SeedUnreadCountEvent = { id: string | null; unreadCount: number };
