import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useState } from 'react';

import { type Seed, commands } from './bindings';
import useEvent from './useEvent';

const useSeeds = () => {
  const [seeds, setSeeds] = useState<Seed[]>([]);

  const refresh = useCallback(() => {
    commands.dbGetAllSeeds().then(setSeeds);
  }, []);

  const reorder = useCallback((oldId: number, newId: number) => {
    setSeeds((items) => {
      const oldIndex = items.findIndex((s) => s.id === oldId);
      const newIndex = items.findIndex((s) => s.id === newId);
      const sorted = arrayMove(items, oldIndex, newIndex);

      commands.dbUpdateSeedsRank(sorted.map((s) => s.id));

      return sorted;
    });
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  useEvent('seedAddEvent', refresh);

  return { seeds, refresh, reorder };
};

export default useSeeds;
