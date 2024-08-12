import { useCallback, useEffect, useState } from 'react';
import { dbGetWatchList } from './bindings';
import useEvent from './useEvent';

const useWatchList = () => {
  const [keywords, setKeywords] = useState<string[]>([]);

  const refresh = useCallback(() => {
    dbGetWatchList().then(setKeywords);
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  useEvent('app://watchlist/change', refresh);

  return { keywords, refresh };
};

export default useWatchList;
