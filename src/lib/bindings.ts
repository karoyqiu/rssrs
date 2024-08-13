/* eslint-disable */
// This file was generated by [tauri-specta](https://github.com/oscartbeaumont/tauri-specta). Do not edit this file manually.

declare global {
    interface Window {
        __TAURI_INVOKE__<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
    }
}

// Function avoids 'window not defined' in SSR
const invoke = () => window.__TAURI_INVOKE__;

/**
 * 添加监视关键字。
 */
export function dbAddWatchKeyword(keyword: string) {
    return invoke()<boolean>("db_add_watch_keyword", { keyword })
}

/**
 * 删除监视关键字。
 */
export function dbDeleteWatchKeyword(keyword: string) {
    return invoke()<boolean>("db_delete_watch_keyword", { keyword })
}

/**
 * 获取所有种子。
 */
export function dbGetAllSeeds() {
    return invoke()<Seed[]>("db_get_all_seeds")
}

/**
 * 获取文章。
 */
export function dbGetArticles(filters: ArticleFilters) {
    return invoke()<ArticleResult>("db_get_articles", { filters })
}

/**
 * 获取设置。
 */
export function dbGetSetting(key: string) {
    return invoke()<string>("db_get_setting", { key })
}

/**
 * 获取未读数量。
 */
export function dbGetUnreadCount(seedId: number | null) {
    return invoke()<number>("db_get_unread_count", { seedId })
}

/**
 * 获取监视关键字列表。
 */
export function dbGetWatchList() {
    return invoke()<string[]>("db_get_watch_list")
}

/**
 * 插入种子。
 */
export function dbInsertSeed(name: string, url: string) {
    return invoke()<boolean>("db_insert_seed", { name,url })
}

/**
 * 将文章标记为已读或未读。
 */
export function dbReadArticle(itemId: number, read: boolean) {
    return invoke()<boolean>("db_read_article", { itemId,read })
}

/**
 * 全部标记为已读
 */
export function dbReadAll(seedId: number | null) {
    return invoke()<boolean>("db_read_all", { seedId })
}

/**
 * 修改设置。
 */
export function dbSetSetting(key: string, value: string) {
    return invoke()<boolean>("db_set_setting", { key,value })
}

export type ArticleResult = { articles: Article[]; nextCursor: string | null }
/**
 * 种子
 */
export type Seed = { id: number; name: string; url: string; favicon: string | null; interval: number; last_fetched_at: number; last_fetch_ok: boolean }
export type ArticleFilters = { seedId: number | null; cursor: string | null; limit: number | null }
/**
 * 文章
 */
export type Article = { id: number; seed_id: number; seed_name: string; title: string; author: string | null; desc: string | null; link: string; pub_date: number; unread: boolean }
