import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type WatchListDialogProps = {
  children: ReactNode;
};

export default function WatchListDialog(props: WatchListDialogProps) {
  const { children } = props;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Watch list</DialogTitle>
          <DialogDescription>
            Watch articals whose title includes specific keywords.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
