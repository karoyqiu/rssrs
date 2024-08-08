import { useCallback, useEffect, useState } from 'react';
import { dbGetAllSeeds, Seed } from './bindings';

const useSeeds = () => {
  const [seeds, setSeeds] = useState<Seed[]>([]);

  const refresh = useCallback(() => {
    dbGetAllSeeds().then(setSeeds);
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  return { seeds, refresh };
};

export default useSeeds;
