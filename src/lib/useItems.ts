import type { Event } from '@tauri-apps/api/event';
import { unique } from 'radash';
import { useCallback, useEffect, useState } from 'react';
import { dbGetItems, SeedItem, type Seed } from './bindings';
import type { SeedItemReadEvent } from './events';
import useEvent from './useEvent';

const useItems = (seedId: Seed['id'] | null) => {
  const [items, setItems] = useState<SeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, setMore] = useState(true);

  const loadMore = useCallback(async () => {
    const result = await dbGetItems({ seedId, limit: null, cursor });

    setItems((old) =>
      unique([...old, ...result.items], (item) => item.id).sort((a, b) => {
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
    setItems([]);
    setCursor(null);
    setMore(true);
    loadMore();
  }, [loadMore]);

  useEffect(reload, [seedId]);

  const readHandler = useCallback(
    ({ payload }: Event<SeedItemReadEvent>) => {
      setItems((old) => {
        const idx = old.findIndex((item) => item.id === payload.id);

        if (idx >= 0) {
          const current = old[idx];
          return old.toSpliced(idx, 1, { ...current, unread: payload.unread });
        }

        return old;
      });
    },
    [setItems],
  );

  useEvent('app://item/unread', readHandler);

  return { items, more, loadMore, reload };
};

export default useItems;
