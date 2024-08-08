import { useCallback, useEffect, useState } from 'react';
import { dbGetSetting, dbSetSetting } from './bindings';

const useSettings = <T>(
  key: string,
  defaultValue: Readonly<T>,
): [T, (v: T) => Promise<boolean>] => {
  const [value, setValue] = useState<T>(defaultValue);

  const save = useCallback(
    async (v: T) => {
      const ok = await dbSetSetting(key, JSON.stringify(v));

      if (ok) {
        setValue(v);
      }

      return ok;
    },
    [setValue],
  );

  useEffect(() => {
    dbGetSetting(key).then((s) => setValue(JSON.parse(s) as T));
  }, [key]);

  return [value, save];
};

export default useSettings;
