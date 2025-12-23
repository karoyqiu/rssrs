import { EditIcon, ListIcon, RssIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

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
};

export default function SeedToggleItem({ seed, ...props }: SeedToggleItemProps) {
  const unread = useSeedUnreadCount(seed?.id ?? null);

  if (seed) {
    return (
      <ContextMenu>
        <ContextMenuTrigger className="w-full">
          <ToggleGroupItem {...props} className="w-full justify-start" value={seed.id.toString()}>
            <RssIcon />
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
