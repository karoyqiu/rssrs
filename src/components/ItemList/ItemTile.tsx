import type { SeedItem } from '@/lib/bindings';
import ItemCover from './ItemCover';

type ItemTileProps = {
  item: SeedItem;
};

export default function ItemTile(props: ItemTileProps) {
  const { item } = props;

  return (
    <button className="flex h-[24rem] w-full flex-col gap-2 overflow-hidden rounded border">
      <div className="h-[18rem] overflow-hidden">
        <ItemCover desc={item.desc} />
      </div>
      {item.title}
    </button>
  );
}
