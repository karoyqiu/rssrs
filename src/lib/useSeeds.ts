import { useCallback, useEffect, useState } from 'react';

import { type Seed, commands } from './bindings';
import useEvent from './useEvent';

const useSeeds = () => {
  const [seeds, setSeeds] = useState<Seed[]>([]);

  const refresh = useCallback(() => {
    commands.dbGetAllSeeds().then(setSeeds);
  }, []);

  const reorder = useCallback((oldIndex: number, newIndex: number) => {
    if (oldIndex !== newIndex) {
      setSeeds((items) => {
        const sorted = [...items];
        const item = sorted.splice(oldIndex, 1);
        sorted.splice(newIndex, 0, ...item);

        commands.dbUpdateSeedsRank(sorted.map((s) => s.id));

        return sorted;
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  useEvent('seedAddEvent', refresh);

  return { seeds, refresh, reorder };
};

export default useSeeds;
