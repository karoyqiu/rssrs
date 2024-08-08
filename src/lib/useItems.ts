import { unique } from 'radash';
import { useCallback, useEffect, useState } from 'react';
import { dbGetItems, SeedItem } from './bindings';

const useItems = () => {
  const [items, setItems] = useState<SeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, setMore] = useState(true);

  const loadMore = useCallback(async () => {
    const result = await dbGetItems({ seed_id: null, limit: null, cursor });
    setItems((old) => unique([...old, ...result.items], (item) => item.id));
    setCursor(result.next_cursor);
    setMore(!!result.next_cursor);
  }, [cursor]);

  useEffect(() => {
    loadMore();
  }, []);

  return { items, more, loadMore };
};

export default useItems;
