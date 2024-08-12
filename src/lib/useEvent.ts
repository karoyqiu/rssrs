import { listen, type EventCallback, type EventName } from '@tauri-apps/api/event';
import { useEffect } from 'react';

const useEvent = <T>(event: EventName, handler: EventCallback<T>) => {
  useEffect(() => {
    console.debug(`Listen ${event}`);
    const unlisten = listen<T>(event, (event) => {
      console.debug('Event received', event);
      handler(event);
    });

    return () => {
      console.debug(`Unlisten ${event}`);
      unlisten.then((fn) => fn());
    };
  }, [event, handler]);
};

export default useEvent;
