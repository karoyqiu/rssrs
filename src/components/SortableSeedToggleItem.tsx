import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Seed } from '@/lib/bindings';

import SeedToggleItem from './SeedToggleItem';

type SortableSeedToggleItemProps = {
  seed: Pick<Seed, 'id' | 'name' | 'url'>;
};

export default function SortableSeedToggleItem({ seed }: SortableSeedToggleItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: seed.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SeedToggleItem ref={setNodeRef} style={style} {...attributes} {...listeners} seed={seed} />
  );
}
