import { forwardRef } from 'react';
import { Skeleton } from '../ui/skeleton';

const ItemSkeleton = forwardRef<HTMLDivElement>(function ItemSkeleton(_, ref) {
  return (
    <div
      ref={ref}
      className="flex h-[24rem] w-full flex-col gap-2 overflow-hidden rounded border p-2"
    >
      <Skeleton className="grow" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
});

export default ItemSkeleton;
