import type { Event } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useIntersectionObserver } from 'usehooks-ts';

import type { Seed } from '@/lib/bindings';
import type { SeedUnreadCountEvent } from '@/lib/events';
import useEvent from '@/lib/useEvent';
import useItems from '@/lib/useItems';
import ItemTile from './ItemTile';

type ItemListProps = {
  seedId: Seed['id'] | null;
};

export default function ItemList(props: ItemListProps) {
  const { seedId } = props;
  const { items, more, loadMore, reload } = useItems(seedId);
  const { ref } = useIntersectionObserver({
    threshold: 0,
    onChange: (isIntersecting) => {
      if (isIntersecting && more) {
        loadMore();
      }
    },
  });
  const topRef = useRef<HTMLDivElement>(null);

  const toastId = useRef<string | number>();

  const newHandler = useCallback(
    ({ payload }: Event<SeedUnreadCountEvent>) => {
      if (payload.id === seedId) {
        toastId.current = toast.info('There are some new articles.', {
          id: toastId.current,
          duration: Infinity,
          closeButton: true,
          action: {
            label: 'See new articles',
            onClick: reload,
          },
        });
      }
    },
    [seedId],
  );

  useEvent('app://seed/new', newHandler);

  useEffect(() => {
    topRef.current?.scrollIntoView();
  }, [seedId]);

  return (
    <>
      <div ref={topRef} />
      <main className="grid gap-4 p-4 @[50rem]:grid-cols-2 @[75rem]:grid-cols-3 @[100rem]:grid-cols-4 @[125rem]:grid-cols-5">
        {items.map((item) => (
          <ItemTile key={item.id} item={item} />
        ))}
      </main>
      <div className="h-screen w-full" ref={ref} />
    </>
  );
}
