import { useEffect } from 'react';

import { events } from './bindings';

type EventsType = typeof events;

const useEvent = <T extends keyof EventsType>(
  event: T,
  handler: Parameters<EventsType[T]['listen']>[0],
) => {
  useEffect(() => {
    console.debug(`Listen ${event}`);
    const unlisten = events[event].listen(handler);

    return () => {
      console.debug(`Unlisten ${event}`);
      unlisten.then((fn) => fn());
    };
  }, [event, handler]);
};

export default useEvent;
