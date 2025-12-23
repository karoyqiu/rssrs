import { useSortable } from '@dnd-kit/react/sortable';
import { EditIcon, ListIcon, RssIcon } from 'lucide-react';
import { type ComponentProps, useRef } from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Seed } from '@/lib/bindings';
import useSeedUnreadCount from '@/lib/useSeedUnreadCount';

import SeedDialog from './SeedDialog';

type SeedToggleItemProps = Omit<ComponentProps<typeof ToggleGroupItem>, 'value'> & {
  seed: Pick<Seed, 'id' | 'name' | 'url'> | null;
  index: number;
};

export default function SeedToggleItem({ seed, index, ...props }: SeedToggleItemProps) {
  const handle = useRef<HTMLDivElement>(null);
  const { ref } = useSortable({
    id: seed?.id ?? 0,
    index,
    handle,
  });
  const unread = useSeedUnreadCount(seed?.id ?? null);

  if (seed) {
    return (
      <ContextMenu>
        <ContextMenuTrigger ref={ref} className="w-full" asChild>
          <ToggleGroupItem {...props} className="w-full justify-start" value={seed.id.toString()}>
            <div ref={handle}>
              <RssIcon />
            </div>
            <span>{seed.name}</span>
            <span className="ms-auto font-mono">{unread || ''}</span>
          </ToggleGroupItem>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem className="gap-2" onClick={() => SeedDialog.call({ seed })}>
            <EditIcon />
            Edit
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <ToggleGroupItem {...props} className="justify-start" value="0">
      <ListIcon />
      <span>All</span>
      <span className="ms-auto font-mono">{unread || ''}</span>
    </ToggleGroupItem>
  );
}
