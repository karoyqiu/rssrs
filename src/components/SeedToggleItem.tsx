import { ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Seed } from '@/lib/bindings';
import useSeedUnreadCount from '@/lib/useSeedUnreadCount';
import { ListIcon, RssIcon } from 'lucide-react';

type SeedToggleItemProps = {
  seed: Pick<Seed, 'id' | 'name'> | null;
};

export default function SeedToggleItem(props: SeedToggleItemProps) {
  const { seed } = props;
  const unread = useSeedUnreadCount(seed?.id ?? null);

  return (
    <ToggleGroupItem className="justify-start" value={seed?.id.toString() ?? '0'}>
      {seed?.id ? <RssIcon /> : <ListIcon />}
      {seed?.name ?? 'All'}
      <span className="ms-auto font-mono">{unread || ''}</span>
    </ToggleGroupItem>
  );
}
