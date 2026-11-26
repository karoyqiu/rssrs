import { useEffect, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { type LogEntry, commands } from '@/lib/bindings';

export default function LogView() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    commands.getLogs().then(
      (snapshot) => {
        if (active) setEntries(snapshot);
      },
      (error) => {
        if (active) setError(String(error));
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollArea className="h-full min-h-0 w-full">
      <div className="p-2 font-mono text-sm wrap-anywhere whitespace-pre-wrap" aria-label="Logs">
        {error ? (
          <p role="alert">Failed to load logs: {error}</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id}>
              {entry.timestamp} {entry.level} {entry.message}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
