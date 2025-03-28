import { MinusIcon, PlusIcon } from 'lucide-react';
import { Fragment, type ReactNode, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { commands } from '@/lib/bindings';
import useWatchList from '@/lib/useWatchList';

import { ScrollArea } from './ui/scroll-area';

type WatchListDialogProps = {
  children: ReactNode;
};

export default function WatchListDialog(props: WatchListDialogProps) {
  const { children } = props;
  const { keywords } = useWatchList();
  const keywordRef = useRef<HTMLInputElement>(null);

  const add = async () => {
    if (keywordRef.current?.value) {
      const ok = await commands.dbAddWatchKeyword(keywordRef.current.value);

      if (ok) {
        keywordRef.current.value = '';
        keywordRef.current.focus();
      }
    }
  };

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
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              ref={keywordRef}
              autoFocus
              placeholder="Input keyword"
              onKeyDown={async (event) => {
                if (event.key === 'Enter') {
                  await add();
                }
              }}
            />
            <Button className="shrink-0" variant="ghost" size="icon" onClick={add}>
              <PlusIcon />
            </Button>
          </div>
          <hr />
          <ScrollArea>
            <div className="grid grid-cols-[1fr_auto] items-center gap-x-2">
              {keywords.map((k) => (
                <Fragment key={k}>
                  <span>{k}</span>
                  <Button
                    className="text-destructive"
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await commands.dbDeleteWatchKeyword(k);
                      keywordRef.current?.focus();
                    }}
                  >
                    <MinusIcon />
                  </Button>
                </Fragment>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
