import type { SeedItem } from '@/lib/bindings';
import { open } from '@tauri-apps/api/shell';
import ItemCover from './ItemCover';

type ItemTileProps = {
  item: SeedItem;
};

export default function ItemTile(props: ItemTileProps) {
  const { item } = props;

  return (
    <button
      className="flex h-[24rem] w-full flex-col gap-2 overflow-hidden rounded border"
      onClick={() => open(item.link)}
    >
      <div className="h-[18rem] overflow-hidden">
        <ItemCover desc={item.desc} />
      </div>
      {item.title}
    </button>
  );
}
