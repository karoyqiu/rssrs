import { useCallback, useEffect, useState } from 'react';

import { commands } from './bindings';

const useSettings = <T>(
  key: string,
  defaultValue: Readonly<T>,
): [T, (v: T) => Promise<boolean>] => {
  const [value, setValue] = useState<T>(defaultValue);

  const save = useCallback(
    async (v: T) => {
      const ok = await commands.dbSetSetting(key, JSON.stringify(v));

      if (ok) {
        setValue(v);
      }

      return ok;
    },
    [setValue],
  );

  useEffect(() => {
    commands.dbGetSetting(key).then((s) => setValue({ ...defaultValue, ...JSON.parse(s) }));
  }, [key]);

  return [value, save];
};

export default useSettings;
