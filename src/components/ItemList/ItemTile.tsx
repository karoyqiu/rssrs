import { dbMarkItemRead, type SeedItem } from '@/lib/bindings';
import { cn } from '@/lib/utils';
import { open } from '@tauri-apps/api/shell';
import { MailIcon, MailOpenIcon } from 'lucide-react';
import { useIntersectionObserver, useReadLocalStorage } from 'usehooks-ts';
import ItemCover from './ItemCover';

type ItemTileProps = {
  item: SeedItem;
};

export default function ItemTile(props: ItemTileProps) {
  const { item } = props;
  const autoRead = useReadLocalStorage<boolean>('autoRead') ?? true;
  const { ref } = useIntersectionObserver({
    threshold: 0,
    initialIsIntersecting: true,
    onChange: (isIntersecting, entry) => {
      if (autoRead && item.unread && !isIntersecting && entry.boundingClientRect.top < 0) {
        dbMarkItemRead(item.id, false);
      }
    },
  });

  const openLink = async () => {
    await open(item.link);
  };

  return (
    <div
      ref={ref}
      className="flex h-[24rem] w-full flex-col overflow-hidden rounded border"
      data-test={item.id}
    >
      <div className="grow cursor-pointer overflow-hidden" onClick={openLink}>
        <ItemCover desc={item.desc} />
      </div>
      <div className="flex w-full flex-col gap-px p-2 text-start">
        <span
          className={cn(
            'w-full cursor-pointer',
            item.unread ? 'font-bold' : 'text-muted-foreground',
          )}
          onClick={openLink}
        >
          {item.title}
        </span>
        <span className="w-full text-sm text-muted-foreground">{item.seed_name}</span>
        <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
          <span>{new Date(parseInt(item.pub_date, 10) * 1000).toLocaleString()}</span>
          {item.unread ? <MailIcon /> : <MailOpenIcon />}
        </div>
      </div>
    </div>
  );
}
