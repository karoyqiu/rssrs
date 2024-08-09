import type { Event } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';
import { dbGetUnreadCount, type Seed } from './bindings';
import type { SeedUnreadCountEvent } from './events';
import useEvent from './useEvent';

const useSeedUnreadCount = (seedId: Seed['id'] | null) => {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    dbGetUnreadCount(seedId).then(setUnread);
  }, [seedId]);

  const handler = useCallback(
    ({ payload }: Event<SeedUnreadCountEvent>) => {
      if (payload.id === seedId) {
        setUnread(payload.unreadCount);
      }
    },
    [seedId, setUnread],
  );

  useEvent('app://seed/unread', handler);

  return unread;
};

export default useSeedUnreadCount;
