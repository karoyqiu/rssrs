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
 * 插入种子。
 */
export function dbInsertSeed(name: string, url: string) {
    return invoke()<boolean>("db_insert_seed", { name,url })
}

/**
 * 获取所有种子。
 */
export function dbGetAllSeeds() {
    return invoke()<Seed[]>("db_get_all_seeds")
}

/**
 * 种子
 */
export type Seed = { id: number; name: string; url: string; favicon: string | null; interval: number; last_fetched_at: string | null; last_fetch_ok: boolean | null }
