import type { Event } from '@tauri-apps/api/event';
import { unique } from 'radash';
import { useCallback, useEffect, useRef, useState } from 'react';

import { type Article, type ArticleReadEvent, type Seed, commands } from './bindings';
import useEvent from './useEvent';

const useItems = (seedId: Seed['id'] | null, search: string | null, unreadOnly = true) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const cursor = useRef<string | null>(null);
  const more = useRef<boolean>(true);

  const loadMore = useCallback(async () => {
    const result = await commands.dbGetArticles({
      seedId,
      limit: null,
      cursor: cursor.current,
      search,
      unreadOnly,
    });

    if (cursor.current === null && more.current) {
      setArticles(result.articles);
    } else {
      setArticles((old) =>
        unique([...old, ...result.articles], (item) => item.id).sort((a, b) => {
          let diff = b.pub_date - a.pub_date;

          if (diff !== 0) {
            return diff;
          }

          return a.id - b.id;
        }),
      );
    }

    cursor.current = result.nextCursor;
    more.current = !!result.nextCursor;
  }, [seedId, search, unreadOnly]);

  const reload = useCallback(() => {
    cursor.current = null;
    more.current = true;
    loadMore();
  }, [loadMore]);

  useEffect(reload, [loadMore]);

  const readHandler = useCallback(
    ({ payload }: Event<ArticleReadEvent>) => {
      setArticles((old) => {
        if (payload.id > 0) {
          const idx = old.findIndex((item) => item.id === payload.id);

          if (idx >= 0) {
            const current = old[idx];
            return old.toSpliced(idx, 1, { ...current, unread: payload.unread });
          }

          return old;
        } else {
          return old.map((item) => ({ ...item, unread: payload.unread }));
        }
      });
    },
    [setArticles],
  );

  useEvent('articleReadEvent', readHandler);

  return { articles, more, loadMore, reload };
};

export default useItems;
