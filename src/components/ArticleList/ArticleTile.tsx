import { open } from '@tauri-apps/api/shell';
import { MailIcon, MailOpenIcon } from 'lucide-react';
import Highlighter from 'react-highlight-words';
import { useIntersectionObserver, useReadLocalStorage } from 'usehooks-ts';

import { dbReadArticle, type Article } from '@/lib/bindings';
import useWatchList from '@/lib/useWatchList';
import { cn } from '@/lib/utils';
import ItemCover from './ArticleCover';

type ItemTileProps = {
  article: Article;
};

export default function ItemTile(props: ItemTileProps) {
  const { article } = props;
  const { keywords } = useWatchList();
  const autoRead = useReadLocalStorage<boolean>('autoRead') ?? true;
  const { ref } = useIntersectionObserver({
    threshold: 0,
    initialIsIntersecting: true,
    onChange: (isIntersecting, entry) => {
      if (autoRead && article.unread && !isIntersecting && entry.boundingClientRect.top < 0) {
        dbReadArticle(article.id, true);
      }
    },
  });

  const openLink = async () => {
    await open(article.link);
    await dbReadArticle(article.id, true);
  };

  const time = new Date(article.pub_date * 1000);

  return (
    <article
      ref={ref}
      className="flex h-[24rem] w-full flex-col overflow-hidden rounded border"
      data-test={article.id}
    >
      <div
        className="flex grow cursor-pointer flex-col items-center overflow-hidden"
        onClick={openLink}
      >
        <ItemCover desc={article.desc} />
      </div>
      <div className="flex w-full flex-col gap-px p-2 text-start">
        <Highlighter
          searchWords={keywords}
          autoEscape
          textToHighlight={article.title ?? ''}
          className={cn(
            'w-full cursor-pointer',
            article.unread ? 'font-bold' : 'text-muted-foreground',
          )}
          onClick={openLink}
        />
        <address className="w-full text-sm text-muted-foreground">{article.seed_name}</address>
        <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
          <time dateTime={time.toISOString()}>{time.toLocaleString()}</time>
          {article.unread ? <MailIcon /> : <MailOpenIcon />}
        </div>
      </div>
    </article>
  );
}
