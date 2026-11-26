import { useEffect, useRef, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { type LogEntry, commands, events } from '@/lib/bindings';

function mergeEntries(...groups: LogEntry[][]): LogEntry[] {
  return [...new Map(groups.flat().map((entry) => [entry.id, entry])).values()]
    .sort((a, b) => a.id - b.id)
    .slice(-1000);
}

export default function LogView() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let unlisten: (() => void) | undefined;
    let loading = true;
    let buffered: LogEntry[] = [];

    async function load() {
      try {
        // Subscribe first so records created during the snapshot request cannot fall through a gap.
        unlisten = await events.logEvent.listen(({ payload }) => {
          if (!active) return;
          if (loading) buffered = mergeEntries(buffered, [payload]);
          else setEntries((current) => mergeEntries(current, [payload]));
        });
        if (!active) {
          unlisten();
          return;
        }
        const snapshot = await commands.getLogs();
        if (!active) return;
        loading = false;
        setEntries(mergeEntries(snapshot, buffered));
        buffered = [];
      } catch (error) {
        if (!active) return;
        loading = false;
        setEntries(buffered);
        buffered = [];
        setError(String(error));
      }
    }
    void load();
    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [entries]);

  return (
    <ScrollArea className="h-full min-h-0 w-full">
      <div className="p-2 font-mono text-sm wrap-anywhere whitespace-pre-wrap" aria-label="Logs">
        {error && <p role="alert">Failed to load logs: {error}</p>}
        {entries.map((entry) => (
          <div key={entry.id}>
            {entry.timestamp} {entry.level} {entry.message}
          </div>
        ))}
        <div ref={end} />
      </div>
    </ScrollArea>
  );
}
