import { useCallback, useEffect, useState } from 'react';

import { type Seed, commands } from './bindings';
import useEvent from './useEvent';

const useSeeds = () => {
  const [seeds, setSeeds] = useState<Seed[]>([]);

  const refresh = useCallback(() => {
    commands.dbGetAllSeeds().then(setSeeds);
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  useEvent('seedAddEvent', refresh);

  return { seeds, refresh };
};

export default useSeeds;
