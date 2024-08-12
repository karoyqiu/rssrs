import { open } from '@tauri-apps/api/shell';
import { MailIcon, MailOpenIcon } from 'lucide-react';
import Highlighter from 'react-highlight-words';
import { useIntersectionObserver, useReadLocalStorage } from 'usehooks-ts';

import { dbMarkItemRead, type SeedItem } from '@/lib/bindings';
import useWatchList from '@/lib/useWatchList';
import { cn } from '@/lib/utils';
import ItemCover from './ItemCover';

type ItemTileProps = {
  item: SeedItem;
};

export default function ItemTile(props: ItemTileProps) {
  const { item } = props;
  const { keywords } = useWatchList();
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
    await dbMarkItemRead(item.id, false);
  };

  return (
    <div
      ref={ref}
      className="flex h-[24rem] w-full flex-col overflow-hidden rounded border"
      data-test={item.id}
    >
      <div
        className="flex grow cursor-pointer flex-col items-center overflow-hidden"
        onClick={openLink}
      >
        <ItemCover desc={item.desc} />
      </div>
      <div className="flex w-full flex-col gap-px p-2 text-start">
        <Highlighter
          searchWords={keywords}
          autoEscape
          textToHighlight={item.title}
          className={cn(
            'w-full cursor-pointer',
            item.unread ? 'font-bold' : 'text-muted-foreground',
          )}
          onClick={openLink}
        />
        <span className="w-full text-sm text-muted-foreground">{item.seed_name}</span>
        <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
          <span>{new Date(item.pub_date * 1000).toLocaleString()}</span>
          {item.unread ? <MailIcon /> : <MailOpenIcon />}
        </div>
      </div>
    </div>
  );
}
