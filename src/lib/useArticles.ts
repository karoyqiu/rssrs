import type { Event } from '@tauri-apps/api/event';
import { unique } from 'radash';
import { useCallback, useEffect, useState } from 'react';
import { Article, dbGetArticles, type Seed } from './bindings';
import type { ArticleReadEvent } from './events';
import useEvent from './useEvent';

const useItems = (seedId: Seed['id'] | null) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, setMore] = useState(true);

  const loadMore = useCallback(async () => {
    const result = await dbGetArticles({ seedId, limit: null, cursor });

    setArticles((old) =>
      unique([...old, ...result.articles], (item) => item.id).sort((a, b) => {
        let diff = b.pub_date - a.pub_date;

        if (diff !== 0) {
          return diff;
        }

        return a.id - b.id;
      }),
    );

    setCursor(result.nextCursor);
    setMore(!!result.nextCursor);
  }, [seedId, cursor]);

  const reload = useCallback(() => {
    setArticles([]);
    setCursor(null);
    setMore(true);
    loadMore();
  }, [loadMore]);

  useEffect(reload, [seedId]);

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

  useEvent('app://article/unread', readHandler);

  return { articles, more, loadMore, reload };
};

export default useItems;
