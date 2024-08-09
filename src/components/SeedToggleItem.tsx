import { ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Seed } from '@/lib/bindings';
import useSeedUnreadCount from '../lib/useSeedUnreadCount';

type SeedToggleItemProps = {
  seed: Seed | null;
};

export default function SeedToggleItem(props: SeedToggleItemProps) {
  const { seed } = props;
  const unread = useSeedUnreadCount(seed?.id ?? null);

  return (
    <ToggleGroupItem className="justify-between" value={seed?.id ?? '*'}>
      {seed?.name ?? 'All'}
      <span className="font-mono">{unread || ''}</span>
    </ToggleGroupItem>
  );
}
