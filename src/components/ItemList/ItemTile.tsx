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
      className="flex h-[24rem] w-full flex-col overflow-hidden rounded border"
      onClick={() => open(item.link)}
    >
      <div className="grow overflow-hidden">
        <ItemCover desc={item.desc} />
      </div>
      <div className="flex w-full flex-col gap-px p-2 text-start">
        <span className="w-full">{item.title}</span>
        <span className="w-full text-sm text-muted-foreground">{item.seed_name}</span>
        <span className="w-full text-sm text-muted-foreground">
          {new Date(item.pub_date * 1000).toLocaleString()}
        </span>
      </div>
    </button>
  );
}
