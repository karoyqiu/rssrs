import { LoaderCircleIcon, type LucideProps } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '../lib/utils';

const Loading = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <LoaderCircleIcon
      ref={ref}
      className={cn('animate-spin', className)}
      stroke="hsl(var(--muted-foreground))"
      {...rest}
    />
  );
});

export default Loading;
