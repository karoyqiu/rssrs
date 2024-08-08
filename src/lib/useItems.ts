import { unique } from 'radash';
import { useCallback, useState } from 'react';
import { dbGetItems, SeedItem } from './bindings';

const useItems = () => {
  const [items, setItems] = useState<SeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, setMore] = useState(true);

  const loadMore = useCallback(async () => {
    console.debug('Loading', cursor);
    const result = await dbGetItems({ seed_id: null, limit: null, cursor });
    console.debug('Loaded', result);

    setItems((old) =>
      unique([...old, ...result.items], (item) => item.id).sort((a, b) => {
        let diff = (b.pub_date ?? 0) - (a.pub_date ?? 0);

        if (diff !== 0) {
          return diff;
        }

        return a.id - b.id;
      }),
    );
    setCursor(result.next_cursor);
    setMore(!!result.next_cursor);
  }, [cursor]);

  return { items, more, loadMore };
};

export default useItems;
