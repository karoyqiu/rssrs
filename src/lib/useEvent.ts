import { listen, type EventCallback, type EventName } from '@tauri-apps/api/event';
import { useEffect } from 'react';

const useEvent = <T>(event: EventName, handler: EventCallback<T>) => {
  useEffect(() => {
    const unlisten = listen<T>(event, handler);

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [event, handler]);
};

export default useEvent;
