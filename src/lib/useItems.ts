import type { Event } from '@tauri-apps/api/event';
import { unique } from 'radash';
import { useCallback, useEffect, useState } from 'react';
import { dbGetItems, SeedItem } from './bindings';
import type { SeedItemReadEvent } from './events';
import useEvent from './useEvent';

const useItems = (seedId: string | null) => {
  const [items, setItems] = useState<SeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, setMore] = useState(true);

  useEffect(() => {
    setItems([]);
    setCursor(null);
    setMore(true);
  }, [seedId]);

  const loadMore = useCallback(async () => {
    const result = await dbGetItems({ seedId, limit: null, cursor });

    setItems((old) =>
      unique([...old, ...result.items], (item) => item.id).sort((a, b) => {
        let diff = parseInt(b.pub_date, 10) - parseInt(a.pub_date, 10);

        if (diff !== 0) {
          return diff;
        }

        return parseInt(a.id, 10) - parseInt(b.id, 10);
      }),
    );

    setCursor(result.nextCursor);
    setMore(!!result.nextCursor);
  }, [seedId, cursor]);

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

  return { items, more, loadMore };
};

export default useItems;
