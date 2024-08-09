import useItems from '@/lib/useItems';
import { useEffect, useRef } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';
import ItemTile from './ItemTile';

type ItemListProps = {
  seedId: string | null;
};

export default function ItemList(props: ItemListProps) {
  const { seedId } = props;
  const { items, more, loadMore } = useItems(seedId);
  const { ref } = useIntersectionObserver({
    threshold: 0,
    onChange: (isIntersecting) => {
      if (isIntersecting && more) {
        loadMore();
      }
    },
  });
  const topRef = useRef<HTMLDivElement>(null);

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
