import { EditIcon, ListIcon, RssIcon } from 'lucide-react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Seed } from '@/lib/bindings';
import useSeedUnreadCount from '@/lib/useSeedUnreadCount';

import EditSeedDialog from './EditSeedDialog';

type SeedToggleItemProps = {
  seed: Pick<Seed, 'id' | 'name' | 'url'> | null;
};

const SeedToggleItem = function SeedToggleItem({
  ref,
  ...props
}: SeedToggleItemProps & {
  ref?: React.RefObject<HTMLButtonElement>;
}) {
  const { seed } = props;
  const unread = useSeedUnreadCount(seed?.id ?? null);

  if (seed) {
    return (
      <ContextMenu>
        <ContextMenuTrigger className="w-full">
          <ToggleGroupItem ref={ref} className="w-full justify-start" value={seed.id.toString()}>
            <RssIcon />
            <span>{seed.name}</span>
            <span className="ms-auto font-mono">{unread || ''}</span>
          </ToggleGroupItem>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem className="gap-2" onClick={() => EditSeedDialog.call({ seed })}>
            <EditIcon />
            Edit
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <ToggleGroupItem ref={ref} className="justify-start" value="0">
      <ListIcon />
      <span>All</span>
      <span className="ms-auto font-mono">{unread || ''}</span>
    </ToggleGroupItem>
  );
};

export default SeedToggleItem;
