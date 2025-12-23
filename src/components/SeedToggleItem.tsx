import { ListIcon, RssIcon } from 'lucide-react';

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
      <EditSeedDialog seed={seed}>
        <ToggleGroupItem ref={ref} className="w-full justify-start" value={seed.id.toString()}>
          <RssIcon />
          <span>{seed.name}</span>
          <span className="ms-auto font-mono">{unread || ''}</span>
        </ToggleGroupItem>
      </EditSeedDialog>
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
