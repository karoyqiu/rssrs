import { useCallback, useEffect, useState } from 'react';

import { commands } from './bindings';
import useEvent from './useEvent';

const useWatchList = () => {
  const [keywords, setKeywords] = useState<string[]>([]);

  const refresh = useCallback(() => {
    commands.dbGetWatchList().then(setKeywords);
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  useEvent('watchlistChangeEvent', refresh);

  return { keywords, refresh };
};

export default useWatchList;
