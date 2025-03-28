import type { Event } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';

import { type Seed, type SeedNewEvent, type SeedUnreadCountEvent, commands } from './bindings';
import useEvent from './useEvent';

const useSeedUnreadCount = (seedId: Seed['id'] | null) => {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    commands.dbGetUnreadCount(seedId).then(setUnread);
  }, [seedId]);

  const unreadHandler = useCallback(
    ({ payload }: Event<SeedUnreadCountEvent>) => {
      if (payload.id === seedId || (!payload.id && payload.unreadCount === 0)) {
        setUnread(payload.unreadCount);
      }
    },
    [seedId],
  );
  const newHandler = useCallback(
    ({ payload }: Event<SeedNewEvent>) => {
      if (payload.id === seedId) {
        setUnread((old) => old + payload.unreadCount);
      }
    },
    [seedId],
  );

  useEvent('seedUnreadCountEvent', unreadHandler);
  useEvent('seedNewEvent', newHandler);

  return unread;
};

export default useSeedUnreadCount;
