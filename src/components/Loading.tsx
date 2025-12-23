import { LoaderCircleIcon, type LucideProps } from 'lucide-react';

import { cn } from '@/lib/utils';

const Loading = (
  {
    ref,
    ...props
  }: LucideProps & {
    ref: React.RefObject<SVGSVGElement>;
  }
) => {
  const { className, ...rest } = props;

  return (
    <LoaderCircleIcon
      ref={ref}
      className={cn('animate-spin', className)}
      stroke="hsl(var(--muted-foreground))"
      {...rest}
    />
  );
};

export default Loading;
