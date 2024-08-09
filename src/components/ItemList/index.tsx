import useItems from '@/lib/useItems';
import { useIntersectionObserver } from 'usehooks-ts';
import ItemSkeleton from './ItemSkeleton';
import ItemTile from './ItemTile';

export default function ItemList() {
  const { items, more, loadMore } = useItems();
  const { ref } = useIntersectionObserver({
    threshold: 0.5,
    onChange: (isIntersecting) => {
      if (isIntersecting && more) {
        loadMore();
      }
    },
  });

  return (
    <>
      <main className="grid gap-4 p-4 @[40rem]:grid-cols-2 @[60rem]:grid-cols-3 @[80rem]:grid-cols-4 @[100rem]:grid-cols-5">
        {items.map((item) => (
          <ItemTile key={item.id} item={item} />
        ))}
        {more && <ItemSkeleton ref={ref} />}
      </main>
      <div className="h-screen w-full" />
    </>
  );
}
