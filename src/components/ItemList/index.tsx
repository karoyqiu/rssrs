import useItems from '@/lib/useItems';
import ItemTile from './ItemTile';

export default function ItemList() {
  const { items, more, loadMore } = useItems();

  return (
    <main className="@[40rem]:grid-cols-2 @[60rem]:grid-cols-3 @[80rem]:grid-cols-4 @[100rem]:grid-cols-5 grid gap-4 p-4">
      {items.map((item) => (
        <ItemTile key={item.id} item={item} />
      ))}
    </main>
  );
}
