import type { Event } from '@tauri-apps/api/event';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useIntersectionObserver } from 'usehooks-ts';

import type { Seed } from '@/lib/bindings';
import type { SeedUnreadCountEvent } from '@/lib/events';
import useArticles from '@/lib/useArticles';
import useEvent from '@/lib/useEvent';
import useWatchList from '@/lib/useWatchList';

import ItemTile from './ArticleTile';

type ItemListProps = {
  seedId: Seed['id'] | null;
  search: string | null;
  unreadOnly?: boolean;
};

export default function ItemList(props: ItemListProps) {
  const { seedId, search, unreadOnly } = props;
  const { articles, more, loadMore, reload } = useArticles(seedId, search, unreadOnly);
  const { keywords } = useWatchList();
  const itemKeywords = useMemo(() => {
    if (search) {
      return [...keywords, search];
    }

    return keywords;
  }, [keywords, search]);

  const { ref } = useIntersectionObserver({
    threshold: 0,
    onChange: (isIntersecting) => {
      if (isIntersecting && more) {
        loadMore();
      }
    },
  });
  const topRef = useRef<HTMLDivElement>(null);

  const toastId = useRef<string | number>();

  const newHandler = useCallback(
    ({ payload }: Event<SeedUnreadCountEvent>) => {
      if (payload.id === seedId) {
        toastId.current = toast.info('There are some new articles.', {
          id: toastId.current,
          duration: Infinity,
          closeButton: true,
          action: {
            label: 'See new articles',
            onClick: reload,
          },
        });
      }
    },
    [seedId],
  );

  useEvent('app://seed/new', newHandler);

  useEffect(() => {
    topRef.current?.scrollIntoView();
  }, [seedId, search]);

  useEffect(() => {
    console.log(`Articles count: ${articles.length}`);
  }, [articles.length]);

  return (
    <>
      <div ref={topRef} />
      <main className="grid gap-4 p-4 @[50rem]:grid-cols-2 @[75rem]:grid-cols-3 @[100rem]:grid-cols-4 @[125rem]:grid-cols-5">
        {articles.map((article) => (
          <ItemTile key={article.id} article={article} keywords={itemKeywords} />
        ))}
      </main>
      <div className="h-screen w-full" ref={ref} />
    </>
  );
}
