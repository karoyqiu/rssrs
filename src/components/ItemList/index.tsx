import useItems from '@/lib/useItems';
import ItemSkeleton from './ItemSkeleton';
import ItemTile from './ItemTile';

export default function ItemList() {
  const { items, more, loadMore } = useItems();

  return (
    <main className="grid gap-4 p-4 @[40rem]:grid-cols-2 @[60rem]:grid-cols-3 @[80rem]:grid-cols-4 @[100rem]:grid-cols-5">
      {items.map((item) => (
        <ItemTile key={item.id} item={item} />
      ))}
      <ItemSkeleton />
    </main>
  );
}
