import { useCallback, useEffect, useState } from 'react';
import { dbGetAllSeeds, Seed } from './bindings';
import useEvent from './useEvent';

const useSeeds = () => {
  const [seeds, setSeeds] = useState<Seed[]>([]);

  const refresh = useCallback(() => {
    dbGetAllSeeds().then(setSeeds);
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  useEvent('app://seed/add', refresh);

  return { seeds, refresh };
};

export default useSeeds;
